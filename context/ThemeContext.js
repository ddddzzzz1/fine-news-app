import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeWindStyleSheet } from "nativewind";

const THEME_STORAGE_KEY = "fine_news_theme_preference";
const FALLBACK_COLOR_SCHEME = "light";
const DEFAULT_PREFERENCE = "system";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [preference, setPreference] = useState(DEFAULT_PREFERENCE);
    const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || FALLBACK_COLOR_SCHEME);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let isMounted = true;
        AsyncStorage.getItem(THEME_STORAGE_KEY)
            .then((stored) => {
                if (!isMounted || !stored) return;
                if (stored === "light" || stored === "dark" || stored === "system") {
                    setPreference(stored);
                }
            })
            .catch((error) => {
                console.warn("Failed to read theme preference", error);
            })
            .finally(() => {
                if (isMounted) {
                    setIsReady(true);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme(colorScheme || FALLBACK_COLOR_SCHEME);
        });
        return () => subscription.remove();
    }, []);

    const resolvedTheme =
        preference === "system" ? systemScheme || FALLBACK_COLOR_SCHEME : preference || FALLBACK_COLOR_SCHEME;

    useEffect(() => {
        NativeWindStyleSheet.setColorScheme(resolvedTheme);
    }, [resolvedTheme]);

    const persistPreference = useCallback(async (nextPreference) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        } catch (error) {
            console.warn("Failed to persist theme preference", error);
        }
    }, []);

    const setTheme = useCallback(
        (nextPreference) => {
            if (!nextPreference || nextPreference === preference) return;
            if (!["light", "dark", "system"].includes(nextPreference)) return;
            setPreference(nextPreference);
            persistPreference(nextPreference);
        },
        [persistPreference, preference]
    );

    const value = useMemo(
        () => ({
            theme: preference,
            resolvedTheme,
            setTheme,
            isReady,
        }),
        [isReady, preference, resolvedTheme, setTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useThemeMode must be used within a ThemeProvider");
    }
    return context;
}
