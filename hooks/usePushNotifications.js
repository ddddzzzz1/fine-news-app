import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { logAnalyticsEvent } from "../lib/analytics";

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
const INITIAL_PROMPT_STORAGE_KEY = "fine_news_push_permission_prompted";

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
    const [initialPromptChecked, setInitialPromptChecked] = useState(false);
    const autoRegisterAttempted = useRef(false);

    const isSupported = Device.isDevice && Platform.OS !== "web";

    const logPushEvent = useCallback(async (name, params = {}) => {
        try {
            await logAnalyticsEvent(name, {
                ...params,
                platform: Platform.OS,
                user_id: userId ?? "anonymous",
            });
        } catch (error) {
            console.warn("Failed to send push analytics event", name, error);
        }
    }, [userId]);

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

    const requestSystemPermission = useCallback(
        async ({ forcePrompt = false, source = "manual" } = {}) => {
            if (!isSupported) {
                setPermissionStatus("unsupported");
                return { status: "unsupported" };
            }

            try {
                let statusResult = await Notifications.getPermissionsAsync();
                const shouldPrompt =
                    forcePrompt || (statusResult.canAskAgain && statusResult.status !== "granted");

                if (shouldPrompt) {
                    statusResult = await Notifications.requestPermissionsAsync();
                }

                setPermissionStatus(statusResult.status);
                await logPushEvent("push_permission_prompt", {
                    source,
                    status: statusResult.status,
                });
                return statusResult;
            } catch (error) {
                console.warn("Notification permission request failed", error);
                setLastError(error);
                await logPushEvent("push_permission_error", {
                    source,
                    message: error?.message ?? "unknown",
                });
                return { status: "error", error };
            }
        },
        [isSupported, logPushEvent]
    );

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
        async ({ requestPermissions = false, reason = "auto" } = {}) => {
            if (!userId || !isSupported) {
                return { ok: false, reason: "unsupported" };
            }

            setIsSyncing(true);
            setLastError(null);

            try {
                let statusResult = await Notifications.getPermissionsAsync();
                if (requestPermissions && statusResult.status !== "granted") {
                    statusResult = await requestSystemPermission({ forcePrompt: true, source: reason });
                } else {
                    setPermissionStatus(statusResult.status);
                }

                if (statusResult.status !== "granted") {
                    await logPushEvent("push_opt_in_denied", {
                        reason,
                        status: statusResult.status,
                    });
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

                await logPushEvent(requestPermissions ? "push_opt_in" : "push_token_refresh", {
                    reason,
                    success: true,
                });

                return { ok: true, token };
            } catch (error) {
                console.warn("Failed to register push notifications", error);
                setLastError(error);
                await logPushEvent("push_opt_in_error", {
                    reason,
                    message: error?.message ?? "unknown",
                });
                return { ok: false, reason: "error", error };
            } finally {
                setIsSyncing(false);
            }
        },
        [fetchSettings, isSupported, logPushEvent, persistTokenMetadata, requestSystemPermission, userId]
    );

    const registerForPushNotifications = useCallback(() => {
        return ensureDeviceRegistration({ requestPermissions: true, reason: "cta" });
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
                await logPushEvent("push_preference_update", {
                    fields: Object.keys(partialPreferences),
                });
            } catch (error) {
                setLastError(error);
                throw error;
            } finally {
                setIsUpdatingPreferences(false);
            }
        },
        [fetchSettings, logPushEvent, userId]
    );

    const setNotificationsEnabled = useCallback(
        async (enabled) => {
            if (!userId) return;
            setIsUpdatingPreferences(true);

            try {
                await setDoc(
                    doc(db, "user_push_settings", userId),
                    {
                        enabled,
                        updated_at: serverTimestamp(),
                    },
                    { merge: true }
                );
                await fetchSettings();
                await logPushEvent(enabled ? "push_enabled" : "push_disabled");
            } catch (error) {
                console.warn("Failed to toggle push enabled state", error);
                setLastError(error);
            } finally {
                setIsUpdatingPreferences(false);
            }
        },
        [fetchSettings, logPushEvent, userId]
    );

    const updateQuietHours = useCallback(
        async (quietHours) => {
            if (!userId) return;
            setIsUpdatingPreferences(true);

            try {
                await setDoc(
                    doc(db, "user_push_settings", userId),
                    {
                        quiet_hours: {
                            ...DEFAULT_QUIET_HOURS,
                            ...(quietHours ?? {}),
                        },
                        updated_at: serverTimestamp(),
                    },
                    { merge: true }
                );
                await fetchSettings();
                await logPushEvent("push_quiet_hours_update", quietHours);
            } catch (error) {
                console.warn("Failed to update quiet hours", error);
                setLastError(error);
            } finally {
                setIsUpdatingPreferences(false);
            }
        },
        [fetchSettings, logPushEvent, userId]
    );

    useEffect(() => {
        refreshPermissionStatus();
    }, [refreshPermissionStatus]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!isSupported) {
                setInitialPromptChecked(true);
                return;
            }

            try {
                const alreadyPrompted = await AsyncStorage.getItem(INITIAL_PROMPT_STORAGE_KEY);
                if (alreadyPrompted) {
                    setInitialPromptChecked(true);
                    return;
                }

                try {
                    await requestSystemPermission({ forcePrompt: true, source: "app_launch" });
                } finally {
                    await AsyncStorage.setItem(INITIAL_PROMPT_STORAGE_KEY, "1");
                }
                if (!cancelled) {
                    setInitialPromptChecked(true);
                }
            } catch (error) {
                console.warn("Initial push permission prompt failed", error);
                if (!cancelled) {
                    setInitialPromptChecked(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isSupported, requestSystemPermission]);

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
            ensureDeviceRegistration({ requestPermissions: false, reason: "auto" });
        }
    }, [ensureDeviceRegistration, permissionStatus, userId]);

    const notificationsEnabled = pushSettings?.enabled ?? true;

    return {
        isSupported,
        permissionStatus,
        pushSettings,
        notificationsEnabled,
        isSyncing,
        isUpdatingPreferences,
        lastError,
        initialPromptChecked,
        refreshPermissionStatus,
        refreshSettings: fetchSettings,
        ensureDeviceRegistration,
        registerForPushNotifications,
        updatePreferences,
        setNotificationsEnabled,
        updateQuietHours,
        requestSystemPermission,
    };
}
