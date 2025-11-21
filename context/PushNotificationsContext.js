import { createContext, useContext } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const PushNotificationsContext = createContext(null);

export function PushNotificationsProvider({ user, children }) {
    const value = usePushNotifications(user);
    return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
}

export function usePushNotificationsContext() {
    const context = useContext(PushNotificationsContext);
    if (!context) {
        throw new Error("usePushNotificationsContext must be used within a PushNotificationsProvider");
    }
    return context;
}
