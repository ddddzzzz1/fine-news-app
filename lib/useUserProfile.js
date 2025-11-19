import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const FALLBACK_PROFILE = {
    university_name: "",
    verification_status: "unverified",
    student_email_domain: "",
};

export function useUserProfile(userId) {
    return useQuery({
        queryKey: ["user-profile", userId],
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const ref = doc(db, "user_profiles", userId);
            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                return FALLBACK_PROFILE;
            }

            const data = snapshot.data();
            return {
                ...FALLBACK_PROFILE,
                ...data,
            };
        },
    });
}
