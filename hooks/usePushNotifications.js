import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

const DEFAULT_PREFERENCES = {
    newsletters: true,
    contests: true,
    community: true,
    reminders: true,
};

const DEFAULT_QUIET_HOURS = {
    start_hour: 23,
    end_hour: 8,
};

const MAX_STORED_TOKENS = 5;

function getProjectId() {
    const expoConfig = Constants?.expoConfig;
    const easProjectId =
        expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        expoConfig?.projectId ??
        null;
    return easProjectId;
}

function getAppVersion() {
    return (
        Constants?.expoConfig?.version ||
        Constants?.manifest?.version ||
        Constants?.expoConfig?.extra?.appVersion ||
        "unknown"
    );
}

export function usePushNotifications(user) {
    const userId = user?.uid ?? null;
    const [permissionStatus, setPermissionStatus] = useState("undetermined");
    const [pushSettings, setPushSettings] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
    const [lastError, setLastError] = useState(null);
    const autoRegisterAttempted = useRef(false);

    const isSupported = Device.isDevice && Platform.OS !== "web";

    const defaultTimezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Asia/Seoul";
        } catch {
            return "Asia/Seoul";
        }
    }, []);

    const refreshPermissionStatus = useCallback(async () => {
        if (!isSupported) {
            setPermissionStatus("unsupported");
            return { status: "unsupported" };
        }

        const statusResult = await Notifications.getPermissionsAsync();
        setPermissionStatus(statusResult.status);
        return statusResult;
    }, [isSupported]);

    const fetchSettings = useCallback(async () => {
        if (!userId) {
            setPushSettings(null);
            return null;
        }

        try {
            const snapshot = await getDoc(doc(db, "user_push_settings", userId));
            if (snapshot.exists()) {
                const data = snapshot.data();
                setPushSettings(data);
                return data;
            }
            setPushSettings(null);
            return null;
        } catch (error) {
            console.warn("Failed to load push settings", error);
            setLastError(error);
            return null;
        }
    }, [userId]);

    const persistTokenMetadata = useCallback(
        async (token) => {
            if (!userId) return null;

            const ref = doc(db, "user_push_settings", userId);

            let existing = null;
            try {
                const snapshot = await getDoc(ref);
                existing = snapshot.exists() ? snapshot.data() : null;
            } catch (error) {
                console.warn("Failed to read current push settings", error);
            }

            const currentTokens = Array.isArray(existing?.expo_push_tokens) ? existing.expo_push_tokens : [];
            const dedupedTokens = currentTokens.filter((entry) => entry?.token && entry.token !== token);
            dedupedTokens.unshift({
                token,
                platform: Platform.OS,
                device_name: Device.modelName ?? "Unknown device",
                app_version: getAppVersion(),
                last_seen: new Date(),
            });

            const payload = {
                user_id: userId,
                enabled: existing?.enabled ?? true,
                preferences: {
                    ...DEFAULT_PREFERENCES,
                    ...(existing?.preferences ?? {}),
                },
                quiet_hours: {
                    ...DEFAULT_QUIET_HOURS,
                    ...(existing?.quiet_hours ?? {}),
                },
                timezone: existing?.timezone ?? defaultTimezone,
                expo_push_tokens: dedupedTokens.slice(0, MAX_STORED_TOKENS),
                updated_at: serverTimestamp(),
            };

            await setDoc(ref, payload, { merge: true });
            return payload;
        },
        [defaultTimezone, userId]
    );

    const ensureDeviceRegistration = useCallback(
        async ({ requestPermissions = false } = {}) => {
            if (!userId || !isSupported) {
                return { ok: false, reason: "unsupported" };
            }

            setIsSyncing(true);
            setLastError(null);

            try {
                let statusResult = await Notifications.getPermissionsAsync();
                if (statusResult.status !== "granted" && requestPermissions) {
                    statusResult = await Notifications.requestPermissionsAsync();
                }

                setPermissionStatus(statusResult.status);

                if (statusResult.status !== "granted") {
                    return { ok: false, reason: "denied", status: statusResult.status };
                }

                const projectId = getProjectId();
                if (!projectId) {
                    throw new Error(
                        "Expo projectId is missing. Set extra.eas.projectId in app.json or configure EAS project ID."
                    );
                }

                const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
                const token = tokenResponse.data;

                if (Platform.OS === "android") {
                    await Notifications.setNotificationChannelAsync("default", {
                        name: "일반 알림",
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: "#4F46E5",
                    });
                }

                await persistTokenMetadata(token);
                await fetchSettings();

                return { ok: true, token };
            } catch (error) {
                console.warn("Failed to register push notifications", error);
                setLastError(error);
                return { ok: false, reason: "error", error };
            } finally {
                setIsSyncing(false);
            }
        },
        [fetchSettings, isSupported, persistTokenMetadata, userId]
    );

    const registerForPushNotifications = useCallback(() => {
        return ensureDeviceRegistration({ requestPermissions: true });
    }, [ensureDeviceRegistration]);

    const updatePreferences = useCallback(
        async (partialPreferences) => {
            if (!userId) return;
            setIsUpdatingPreferences(true);
            setLastError(null);

            try {
                const ref = doc(db, "user_push_settings", userId);
                let existingPreferences = {};

                try {
                    const snapshot = await getDoc(ref);
                    existingPreferences = snapshot.exists() ? snapshot.data()?.preferences ?? {} : {};
                } catch (error) {
                    console.warn("Failed to read push preferences", error);
                }

                await setDoc(
                    ref,
                    {
                        preferences: {
                            ...DEFAULT_PREFERENCES,
                            ...existingPreferences,
                            ...partialPreferences,
                        },
                        updated_at: serverTimestamp(),
                    },
                    { merge: true }
                );

                await fetchSettings();
            } catch (error) {
                setLastError(error);
                throw error;
            } finally {
                setIsUpdatingPreferences(false);
            }
        },
        [fetchSettings, userId]
    );

    useEffect(() => {
        refreshPermissionStatus();
    }, [refreshPermissionStatus]);

    useEffect(() => {
        if (!userId) {
            autoRegisterAttempted.current = false;
            setPushSettings(null);
            return;
        }
        fetchSettings();
    }, [fetchSettings, userId]);

    useEffect(() => {
        if (permissionStatus === "granted" && userId && !autoRegisterAttempted.current) {
            autoRegisterAttempted.current = true;
            ensureDeviceRegistration({ requestPermissions: false });
        }
    }, [ensureDeviceRegistration, permissionStatus, userId]);

    return {
        isSupported,
        permissionStatus,
        pushSettings,
        isSyncing,
        isUpdatingPreferences,
        lastError,
        refreshPermissionStatus,
        refreshSettings: fetchSettings,
        ensureDeviceRegistration,
        registerForPushNotifications,
        updatePreferences,
    };
}
