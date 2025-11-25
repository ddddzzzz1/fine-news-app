import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";

export function useAdminClaims() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!isMounted) return;
            if (!user) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const tokenResult = await user.getIdTokenResult(true);
                if (isMounted) {
                    setIsAdmin(!!tokenResult?.claims?.admin);
                }
            } catch (error) {
                console.log("Admin claim fetch error", error);
                if (isMounted) setIsAdmin(false);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, []);

    return { isAdmin, isAdminLoading: isLoading };
}
