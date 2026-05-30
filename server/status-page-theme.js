const THEME_COLOR_KEYS = ["primary", "background", "card", "success", "warning", "danger"];
const PAGE_STYLES = ["classic", "fluent"];
const HEX_COLOR = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

/**
 * @param {string|null|undefined} raw
 * @returns {"classic"|"fluent"}
 */
function normalizePageStyle(raw) {
    return raw === "fluent" ? "fluent" : "classic";
}

/**
 * @returns {Record<string, string>}
 */
function defaultThemeColors() {
    return Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, ""]));
}

/**
 * @param {string|object|null|undefined} raw
 * @returns {Record<string, string>}
 */
function parseThemeColors(raw) {
    const result = defaultThemeColors();

    if (!raw) {
        return result;
    }

    let parsed = raw;

    if (typeof raw === "string") {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return result;
        }
    }

    if (typeof parsed !== "object" || parsed === null) {
        return result;
    }

    for (const key of THEME_COLOR_KEYS) {
        const value = parsed[key];

        if (typeof value === "string" && (value === "" || HEX_COLOR.test(value))) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * @param {object|null|undefined} colors
 * @returns {string}
 */
function stringifyThemeColors(colors) {
    return JSON.stringify(parseThemeColors(colors));
}

module.exports = {
    THEME_COLOR_KEYS,
    PAGE_STYLES,
    defaultThemeColors,
    parseThemeColors,
    stringifyThemeColors,
    normalizePageStyle,
};
