<template>
    <div class="fluent-performance-stats" data-testid="fluent-performance-stats">
        <div v-for="stat in stats" :key="stat.key" class="fluent-stat">
            <span class="fluent-stat-label">{{ stat.label }}</span>
            <span class="fluent-stat-value">{{ stat.value }}</span>
        </div>
    </div>
</template>

<script>
import {
    formatUptimePercent,
    getAveragePing,
    getLastHeartbeat,
} from "../../util/status-page-monitor-stats.js";
import { getFluentServiceStatusForMonitor } from "../../util/fluent-service-status.js";
import { UP } from "../../util.ts";

export default {
    props: {
        monitor: {
            type: Object,
            required: true,
        },
        publicHistoryDays: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        stats() {
            const items = [];
            const uptimeType = this.publicHistoryDays > 0 ? String(this.publicHistoryDays) : "24";

            const uptime = formatUptimePercent(this.$root, this.monitor.id, uptimeType);
            if (uptime) {
                items.push({
                    key: "uptime",
                    label:
                        this.publicHistoryDays > 0
                            ? this.$t("publicHistoryDaysOption", [this.publicHistoryDays])
                            : this.$t("statusPageFluentUptime24h"),
                    value: uptime,
                });
            }

            const avgPing = getAveragePing(this.$root, this.monitor.id);
            if (avgPing != null) {
                items.push({
                    key: "avg-ping",
                    label: this.$t("avgPing"),
                    value: `${avgPing} ms`,
                });
            }

            const last = getLastHeartbeat(this.$root, this.monitor.id);
            if (last && (last.ping || last.ping === 0)) {
                items.push({
                    key: "last-ping",
                    label: this.$t("Response"),
                    value: `${last.ping} ms`,
                });
            }

            if (last?.time) {
                items.push({
                    key: "last-check",
                    label: this.$t("statusPageLastCheck"),
                    value: this.$root.datetime(last.time),
                });
            }

            const status = getFluentServiceStatusForMonitor(this.monitor.id, this.$root);
            items.push({
                key: "status",
                label: this.$t("Status"),
                value: this.$t(status.labelKey),
            });

            if (this.monitor.interval) {
                items.push({
                    key: "interval",
                    label: this.$t("statusPageCheckInterval"),
                    value: this.$t("checkEverySecond", [this.monitor.interval]),
                });
            }

            if (this.showCertificateExpiry) {
                items.push({
                    key: "cert",
                    label: this.$t("Cert Exp."),
                    value: this.certExpiryMessage,
                });
            }

            const beats = this.$root.heartbeatList?.[this.monitor.id] || [];
            if (beats.length > 0) {
                const upCount = beats.filter((b) => b.status === UP).length;
                const downCount = beats.length - upCount;
                items.push({
                    key: "checks",
                    label: this.$t("statusPageChecksInHistory"),
                    value: this.$t("statusPageChecksSummary", [upCount, downCount, beats.length]),
                });
            }

            return items;
        },
        showCertificateExpiry() {
            return Boolean(this.monitor.certExpiryDaysRemaining);
        },
        certExpiryMessage() {
            if (this.monitor?.validCert && this.monitor?.certExpiryDaysRemaining) {
                return this.$t("days", this.monitor.certExpiryDaysRemaining);
            }
            if (this.monitor?.validCert === false) {
                return this.$t("noOrBadCertificate");
            }
            return this.$t("unknownDays");
        },
    },
};
</script>
