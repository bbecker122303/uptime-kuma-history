import { UP } from "../util.ts";

/**
 * @param {object} root Vue root with heartbeatList
 * @param {number} monitorId
 * @returns {object[]}
 */
export function getMonitorHeartbeats(root, monitorId) {
    return root.heartbeatList?.[monitorId] || [];
}

/**
 * @param {object} root Vue root with heartbeatList
 * @param {number} monitorId
 * @returns {object|undefined}
 */
export function getLastHeartbeat(root, monitorId) {
    const beats = getMonitorHeartbeats(root, monitorId);
    return beats.length > 0 ? beats[beats.length - 1] : undefined;
}

/**
 * @param {object} root Vue root with heartbeatList
 * @param {number} monitorId
 * @returns {number|null}
 */
export function getAveragePing(root, monitorId) {
    const beats = getMonitorHeartbeats(root, monitorId);
    let sum = 0;
    let count = 0;

    for (const beat of beats) {
        if (beat.status === UP && (beat.ping || beat.ping === 0)) {
            sum += beat.ping;
            count++;
        }
    }

    return count > 0 ? Math.round(sum / count) : null;
}

/**
 * @param {object} root Vue root with uptimeList
 * @param {number} monitorId
 * @param {string} type Uptime window key (e.g. "24", "7")
 * @returns {string|null} Percent string like "99.5%" or null if unavailable
 */
export function formatUptimePercent(root, monitorId, type) {
    const key = `${monitorId}_${type}`;
    if (root.uptimeList?.[key] === undefined) {
        return null;
    }

    let result = Math.round(root.uptimeList[key] * 10000) / 100;
    if (result > 100) {
        return "100%";
    }
    return `${result}%`;
}
