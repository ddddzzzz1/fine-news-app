export const passwordValidators = [
    {
        key: "length",
        message: "6~12자 사이로 입력하세요",
        check: (password = "") => password.length >= 6 && password.length <= 12,
    },
    {
        key: "lower",
        message: "소문자를 포함해야 합니다",
        check: (password = "") => /[a-z]/.test(password),
    },
    {
        key: "number",
        message: "숫자를 포함해야 합니다",
        check: (password = "") => /\d/.test(password),
    },
];

export const validatePassword = (value) =>
    passwordValidators.every((validator) => validator.check(value || ""));
