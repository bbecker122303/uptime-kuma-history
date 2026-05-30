const { R } = require("redbean-node");

/**
 * @param {number} statusPageId
 * @returns {Promise<number[]>}
 */
async function getMonitorIdsOnStatusPage(statusPageId) {
    const rows = await R.getAll(
        `
        SELECT DISTINCT mg.monitor_id AS monitor_id
        FROM monitor_group mg
        INNER JOIN \`group\` g ON g.id = mg.group_id
        WHERE g.public = 1 AND g.status_page_id = ?
        `,
        [statusPageId]
    );
    return rows.map((row) => Number(row.monitor_id));
}

/**
 * @param {number} incidentId
 * @returns {Promise<number[]>}
 */
async function getIncidentMonitorIds(incidentId) {
    const ids = await R.getCol("SELECT monitor_id FROM incident_monitor WHERE incident_id = ? ORDER BY monitor_id", [
        incidentId,
    ]);
    return (ids || []).map((id) => Number(id));
}

/**
 * @param {number} incidentId
 * @param {number[]} monitorIds
 * @param {number} statusPageId
 * @returns {Promise<number[]>}
 */
async function setIncidentMonitorIds(incidentId, monitorIds, statusPageId) {
    await R.exec("DELETE FROM incident_monitor WHERE incident_id = ?", [incidentId]);

    const allowed = new Set(await getMonitorIdsOnStatusPage(statusPageId));
    const unique = [
        ...new Set(
            (monitorIds || [])
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && id > 0 && allowed.has(id))
        ),
    ];

    for (const monitorId of unique) {
        const row = R.dispense("incident_monitor");
        row.incident_id = incidentId;
        row.monitor_id = monitorId;
        await R.store(row);
    }

    return unique;
}

/**
 * @param {object[]} incidents Public incident objects with id
 * @returns {Promise<object[]>}
 */
async function attachMonitorIdsToIncidents(incidents) {
    if (!incidents?.length) {
        return incidents || [];
    }

    const incidentIds = incidents.map((i) => i.id).filter((id) => id != null);
    if (incidentIds.length === 0) {
        return incidents;
    }

    const placeholders = incidentIds.map(() => "?").join(",");
    const rows = await R.getAll(
        `SELECT incident_id, monitor_id FROM incident_monitor WHERE incident_id IN (${placeholders})`,
        incidentIds
    );

    const map = {};
    for (const row of rows) {
        const incidentId = Number(row.incident_id);
        if (!map[incidentId]) {
            map[incidentId] = [];
        }
        map[incidentId].push(Number(row.monitor_id));
    }

    return incidents.map((incident) => ({
        ...incident,
        monitorIds: map[incident.id] || [],
    }));
}

module.exports = {
    getMonitorIdsOnStatusPage,
    getIncidentMonitorIds,
    setIncidentMonitorIds,
    attachMonitorIdsToIncidents,
};
