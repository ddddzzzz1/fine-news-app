// import * as Analytics from "expo-firebase-analytics";

export async function logAnalyticsEvent(name, params = {}) {
    if (!name) {
        return;
    }

    try {
        // TODO: Implement native analytics using react-native-firebase
        // await Analytics.logEvent(name, params);
        console.log(`[Analytics] ${name}`, params);
    } catch (error) {
        console.warn("Failed to log analytics event", name, error);
    }
}
