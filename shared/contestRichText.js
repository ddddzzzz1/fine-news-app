const sanitizeHtml = require("sanitize-html");

const COLOR_PATTERNS = [
    /^#[0-9a-f]{3}$/i,
    /^#[0-9a-f]{6}$/i,
    /^rgb\(\s*(\d{1,3}\s*,){2}\s*\d{1,3}\s*\)$/i,
    /^rgba\(\s*(\d{1,3}\s*,){3}\s*(0|1|0?\.\d+)\s*\)$/i,
    /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/i,
    /^hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\)$/i,
];

const RICH_TEXT_OPTIONS = {
    allowedTags: ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "span"],
    disallowedTagsMode: "discard",
    allowedAttributes: {
        span: ["style"],
        p: ["style"],
        li: ["style"],
    },
    allowedStyles: {
        "*": {
            color: COLOR_PATTERNS,
        },
    },
    transformTags: {
        b: "strong",
        i: "em",
    },
    parser: {
        lowerCaseTags: true,
    },
};

const plainToHtml = (value = "") => value.replace(/\r?\n/g, "<br />");

const normalizeContestHtml = (value = "") => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) {
        return "";
    }
    const hasTags = /<\/?[a-z][\s\S]*>/i.test(trimmed);
    return hasTags ? trimmed : plainToHtml(trimmed);
};

const sanitizeContestHtml = (value = "") => {
    const normalized = normalizeContestHtml(value);
    if (!normalized) {
        return "";
    }
    return sanitizeHtml(normalized, RICH_TEXT_OPTIONS);
};

const buildContestHtmlBlock = (value = "") => {
    const sanitized = sanitizeContestHtml(value);
    return sanitized ? `<div>${sanitized}</div>` : "";
};

const sanitizeContestFields = (contest = {}) => {
    if (!contest || typeof contest !== "object") {
        return contest;
    }
    const sanitized = { ...contest };
    ["description", "requirements", "benefits"].forEach((key) => {
        if (sanitized[key]) {
            sanitized[key] = sanitizeContestHtml(sanitized[key]);
        }
    });
    return sanitized;
};

module.exports = {
    contestRichTextOptions: RICH_TEXT_OPTIONS,
    sanitizeContestHtml,
    sanitizeContestFields,
    buildContestHtmlBlock,
    normalizeContestHtml,
};
