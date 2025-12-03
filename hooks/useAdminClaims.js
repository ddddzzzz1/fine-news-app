import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export function useAdminClaims() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let unsubscribeProfile = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (!isMounted) return;

            // Clear previous profile listener when auth changes
            unsubscribeProfile?.();

            if (!user) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            if (user.email === "fine3410@gmail.com") {
                setIsAdmin(true);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const profileRef = doc(db, "user_profiles", user.uid);
                unsubscribeProfile = onSnapshot(
                    profileRef,
                    (snapshot) => {
                        if (!isMounted) return;
                        const profileData = snapshot.exists() ? snapshot.data() : null;
                        const isProfileAdmin = profileData?.verification_status === "admin";
                        setIsAdmin(!!isProfileAdmin);
                        setIsLoading(false);
                    },
                    (error) => {
                        console.log("Admin profile fetch error", error);
                        if (isMounted) {
                            setIsAdmin(false);
                            setIsLoading(false);
                        }
                    }
                );
            } catch (error) {
                console.log("Admin profile fetch error", error);
                setIsAdmin(false);
                setIsLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsubscribeProfile?.();
            unsubscribeAuth?.();
        };
    }, []);

    return { isAdmin, isAdminLoading: isLoading };
}
