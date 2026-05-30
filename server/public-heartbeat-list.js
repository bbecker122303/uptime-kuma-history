const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const { R } = require("redbean-node");
const { UP, DOWN, MAINTENANCE } = require("../src/util");

dayjs.extend(utc);

const MAX_PUBLIC_HEARTBEATS = 1500;
const MAX_RECENT_RAW_HEARTBEATS = 150;

/**
 * Reduce heartbeat list to at most maxCount entries while preserving order.
 * @param {object[]} list Heartbeats in chronological order
 * @param {number} maxCount Maximum number of entries
 * @returns {object[]} Downsampled list
 */
function downsampleHeartbeats(list, maxCount) {
    if (list.length <= maxCount) {
        return list;
    }

    const result = [];
    const step = list.length / maxCount;

    for (let i = 0; i < maxCount; i++) {
        result.push(list[Math.floor(i * step)]);
    }

    return result;
}

/**
 * Pick aggregate stat table/granularity for a public history window.
 * @param {number} publicHistoryDays Configured status page history days
 * @returns {{ table: string, since: dayjs.Dayjs }}
 */
function getStatQueryConfig(publicHistoryDays) {
    const days = Math.max(1, Math.min(90, publicHistoryDays));

    if (days >= 14) {
        return {
            table: "stat_daily",
            since: dayjs.utc().subtract(days, "day").startOf("day"),
        };
    }

    if (days >= 2) {
        return {
            table: "stat_hourly",
            since: dayjs.utc().subtract(days, "day").startOf("hour"),
        };
    }

    return {
        table: "stat_minutely",
        since: dayjs.utc().subtract(days, "day").startOf("minute"),
    };
}

/**
 * Convert an aggregate stat row to public heartbeat JSON.
 * @param {object} row Stat row from database
 * @returns {object} Public heartbeat object
 */
function statRowToPublicHeartbeat(row) {
    let status = null;
    let maintenance = 0;

    if (row.extras != null) {
        try {
            const extras = JSON.parse(row.extras);
            maintenance = extras.maintenance || 0;
        } catch (_) {
            // ignore invalid extras
        }
    }

    if (maintenance > 0 && row.up === 0 && row.down === 0) {
        status = MAINTENANCE;
    } else if (row.down > 0) {
        status = DOWN;
    } else if (row.up > 0) {
        status = UP;
    }

    return {
        status,
        time: dayjs.unix(row.timestamp).utc().format("YYYY-MM-DD HH:mm:ss"),
        msg: "",
        ping: row.ping,
    };
}

/**
 * Fetch recent raw heartbeats for a monitor.
 * @param {number} monitorID Monitor ID
 * @param {dayjs.Dayjs} since Start time (UTC)
 * @returns {Promise<object[]>} Public heartbeat objects
 */
async function fetchRecentRawHeartbeats(monitorID, since) {
    const list = await R.getAll(
        `
        SELECT * FROM heartbeat
        WHERE monitor_id = ?
        AND time >= ?
        ORDER BY time ASC
    `,
        [monitorID, since.format("YYYY-MM-DD HH:mm:ss")]
    );

    return R.convertToBeans("heartbeat", list).map((row) => row.toPublicJSON());
}

/**
 * Estimate how many days of history the beat list actually covers.
 * @param {object[]|undefined} beats Public heartbeat list
 * @param {number} publicHistoryDays Configured status page history days
 * @returns {number} Effective days for uptime calculation
 */
function getEffectiveHistoryDays(beats, publicHistoryDays) {
    if (!beats || beats.length === 0) {
        return 1;
    }

    const firstBeat = beats.find((b) => b?.time);
    if (!firstBeat?.time) {
        return 1;
    }

    const minutes = dayjs.utc().diff(dayjs.utc(firstBeat.time), "minutes");
    const days = Math.max(1, Math.ceil(minutes / (24 * 60)));
    return Math.min(publicHistoryDays, days);
}

/**
 * Build public heartbeat bar data from aggregate stats (stat_daily/hourly/minutely).
 * After migration, long-term history lives here — not in the raw heartbeat table.
 * Recent raw heartbeats are always appended so status and "now" stay accurate.
 * @param {number} monitorID Monitor ID
 * @param {number} publicHistoryDays Configured status page history days
 * @returns {Promise<object[]|null>} Public heartbeat list, or null if no data
 */
async function buildPublicHeartbeatList(monitorID, publicHistoryDays) {
    const { table, since } = getStatQueryConfig(publicHistoryDays);
    const configuredMinutes = publicHistoryDays * 24 * 60;

    const rows = await R.getAll(
        `
        SELECT timestamp, ping, up, down, extras
        FROM ${table}
        WHERE monitor_id = ?
        AND timestamp >= ?
        ORDER BY timestamp ASC
    `,
        [monitorID, since.unix()]
    );

    let historicalBeats = [];
    let recentRawSince;

    if (table === "stat_daily") {
        const startOfToday = dayjs.utc().startOf("day");
        historicalBeats = rows.filter((row) => row.timestamp < startOfToday.unix()).map(statRowToPublicHeartbeat);
        recentRawSince = startOfToday;
    } else if (table === "stat_hourly") {
        const startOfRecent = dayjs.utc().subtract(24, "hour").startOf("hour");
        historicalBeats = rows.filter((row) => row.timestamp < startOfRecent.unix()).map(statRowToPublicHeartbeat);
        recentRawSince = startOfRecent;
    } else {
        const startOfRecent = dayjs.utc().subtract(1, "hour").startOf("minute");
        historicalBeats = rows.filter((row) => row.timestamp < startOfRecent.unix()).map(statRowToPublicHeartbeat);
        recentRawSince = startOfRecent;
    }

    const recentRaw = await fetchRecentRawHeartbeats(monitorID, recentRawSince);

    // New / short-history monitors: use raw heartbeats only (no misleading 90d daily bars)
    if (historicalBeats.length > 0) {
        const firstHistoricalTime = historicalBeats[0]?.time;
        if (firstHistoricalTime) {
            const spanMinutes = dayjs.utc().diff(dayjs.utc(firstHistoricalTime), "minutes");
            if (spanMinutes < configuredMinutes * 0.9) {
                const rawSince = dayjs.utc().subtract(publicHistoryDays, "day");
                const rawAll = await fetchRecentRawHeartbeats(monitorID, rawSince);
                if (rawAll.length > 0) {
                    return downsampleHeartbeats(rawAll, MAX_PUBLIC_HEARTBEATS);
                }
            }
        }
    }

    if (historicalBeats.length === 0 && recentRaw.length === 0) {
        return null;
    }

    // Keep all recent raw beats so the last bar reflects the latest check ("now")
    const recent = recentRaw.slice(-MAX_RECENT_RAW_HEARTBEATS);
    const historicalBudget = Math.max(0, MAX_PUBLIC_HEARTBEATS - recent.length);
    const downsampledHistorical = downsampleHeartbeats(historicalBeats, historicalBudget);

    return downsampledHistorical.concat(recent);
}

module.exports = {
    MAX_PUBLIC_HEARTBEATS,
    buildPublicHeartbeatList,
    downsampleHeartbeats,
    getEffectiveHistoryDays,
};
