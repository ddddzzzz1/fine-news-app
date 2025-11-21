const collectTestEmails = () => {
    const envKeys = [
        "EXPO_PUBLIC_TEST_EMAIL",
        "EXPO_PUBLIC_TEST_EMAILS",
        "EXPO_PUBLIC_TESTER_EMAILS",
    ];

    return envKeys
        .map((key) => process.env[key])
        .filter(Boolean)
        .flatMap((value) =>
            value
                .split(",")
                .map((email) => email.trim().toLowerCase())
                .filter(Boolean)
        );
};

let cachedTestEmailSet = null;

const getTestEmailSet = () => {
    if (cachedTestEmailSet) {
        return cachedTestEmailSet;
    }

    cachedTestEmailSet = new Set(collectTestEmails());
    return cachedTestEmailSet;
};

export const isTestAccountEmail = (email) => {
    if (!email) {
        return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
        return false;
    }

    return getTestEmailSet().has(normalizedEmail);
};

export const logAuthEvent = (event, payload = {}) => {
    const sanitizedPayload = { ...payload };

    if (sanitizedPayload.password) {
        delete sanitizedPayload.password;
    }

    if (sanitizedPayload.error instanceof Error) {
        const { name, message, code } = sanitizedPayload.error;
        sanitizedPayload.error = { name, message, code };
    }

    console.log(`[Auth] ${event}`, {
        timestamp: new Date().toISOString(),
        ...sanitizedPayload,
    });
};
