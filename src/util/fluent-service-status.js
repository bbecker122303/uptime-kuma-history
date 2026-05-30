import { DOWN, UP, PENDING, MAINTENANCE } from "../util.ts";

/**
 * @param {number|undefined} status Last heartbeat status
 * @returns {{ tone: string, labelKey: string }}
 */
export function getFluentServiceStatus(status) {
    if (status === UP) {
        return { tone: "operational", labelKey: "statusPageFluentOperational" };
    }
    if (status === DOWN) {
        return { tone: "down", labelKey: "statusPageFluentDown" };
    }
    if (status === PENDING) {
        return { tone: "degraded", labelKey: "statusPageFluentDegraded" };
    }
    if (status === MAINTENANCE) {
        return { tone: "maintenance", labelKey: "statusPageFluentMaintenance" };
    }
    return { tone: "unknown", labelKey: "statusPageFluentStatusUnknown" };
}

/**
 * @param {number} monitorId
 * @param {object} root Vue root ($root)
 * @returns {{ tone: string, labelKey: string }}
 */
export function getFluentServiceStatusForMonitor(monitorId, root) {
    const heartbeats = root.heartbeatList[monitorId] ?? [];
    const lastHeartbeat = heartbeats[heartbeats.length - 1];
    return getFluentServiceStatus(lastHeartbeat?.status);
}
