import * as Analytics from "expo-firebase-analytics";

export async function logAnalyticsEvent(name, params = {}) {
    if (!name) {
        return;
    }

    try {
        await Analytics.logEvent(name, params);
    } catch (error) {
        console.warn("Failed to log analytics event", name, error);
    }
}
