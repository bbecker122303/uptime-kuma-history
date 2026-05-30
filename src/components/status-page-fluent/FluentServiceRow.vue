<template>
    <div
        class="fluent-service-row"
        :class="{ 'is-expanded': isExpanded }"
        data-testid="monitor"
        :data-monitor-id="monitor.id"
    >
        <div
            class="fluent-service-row-header"
            :class="{ expanded: isExpanded }"
            role="button"
            tabindex="0"
            :aria-expanded="isExpanded"
            data-testid="fluent-service-row-toggle"
            @click="toggleExpand"
            @keydown.enter.prevent="toggleExpand"
            @keydown.space.prevent="toggleExpand"
        >
            <div v-if="!editMode" class="fluent-expand-icon">
                <font-awesome-icon icon="chevron-right" />
            </div>

            <div v-if="editMode" class="fluent-edit-actions" @click.stop>
                <font-awesome-icon icon="arrows-alt-v" class="action drag" />
                <font-awesome-icon icon="times" class="action remove" @click="$emit('remove')" />
                <font-awesome-icon
                    icon="cog"
                    class="action"
                    data-testid="monitor-settings"
                    @click="$emit('open-settings')"
                />
            </div>

            <div class="fluent-service-row-grid">
                <span class="fluent-status-label" :class="'tone-' + status.tone" data-testid="fluent-service-status">
                    {{ $t(status.labelKey) }}
                </span>

                <div class="fluent-service-main">
                    <p class="fluent-service-name">
                        <StatusPageOutageIndicator
                            v-if="linkedIncidents.length > 0 && !editMode"
                            :count="linkedIncidents.length"
                        />
                        <a
                            v-if="showLink"
                            :href="monitor.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="monitor-name"
                            @click.stop
                        >
                            {{ monitor.name }}
                        </a>
                        <span v-else data-testid="monitor-name">{{ monitor.name }}</span>
                    </p>
                    <div v-if="hasMeta" class="fluent-service-meta" @click.stop>
                        <span
                            v-if="showCertificateExpiry && monitor.certExpiryDaysRemaining"
                            class="fluent-tag-chip"
                        >
                            {{ $t("Cert Exp.") }}: {{ certExpiryMessage }}
                        </span>
                        <span
                            v-for="(tag, index) in monitor.tags"
                            :key="tag.name + '-' + index"
                            class="fluent-tag-chip"
                            data-testid="monitor-tag"
                        >
                            {{ tagDisplay(tag) }}
                        </span>
                    </div>
                </div>

                <div v-if="!editMode" class="fluent-service-metrics" data-testid="fluent-service-metrics">
                    <span class="fluent-uptime-value" :title="uptimePeriodLabel">{{ uptimeText }}</span>
                    <div class="fluent-inline-bar" data-testid="fluent-inline-heartbeat">
                        <HeartbeatBar
                            size="small"
                            :monitor-id="monitor.id"
                            :heartbeat-bar-days="publicHistoryDays"
                            color-source="status-page"
                        />
                    </div>
                    <span class="fluent-metrics-hint" aria-hidden="true">
                        {{ isExpanded ? $t("statusPageFluentHideDetails") : $t("statusPageFluentShowDetails") }}
                    </span>
                </div>
            </div>
        </div>

        <div v-show="isExpanded" class="fluent-service-expanded" data-testid="fluent-service-expanded">
            <FluentServiceStats :monitor="monitor" :public-history-days="publicHistoryDays" />
            <FluentServiceOutages :incidents="linkedIncidents" />
        </div>
    </div>
</template>

<script>
import HeartbeatBar from "../HeartbeatBar.vue";
import FluentServiceOutages from "./FluentServiceOutages.vue";
import FluentServiceStats from "./FluentServiceStats.vue";
import StatusPageOutageIndicator from "../StatusPageOutageIndicator.vue";
import { getFluentServiceStatusForMonitor } from "../../util/fluent-service-status.js";

export default {
    components: {
        HeartbeatBar,
        FluentServiceOutages,
        FluentServiceStats,
        StatusPageOutageIndicator,
    },
    props: {
        monitor: {
            type: Object,
            required: true,
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        showLink: {
            type: Boolean,
            default: false,
        },
        showTags: {
            type: Boolean,
            default: false,
        },
        showCertificateExpiry: {
            type: Boolean,
            default: false,
        },
        publicHistoryDays: {
            type: Number,
            default: 0,
        },
        linkedIncidents: {
            type: Array,
            default: () => [],
        },
        expanded: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["remove", "open-settings", "toggle-expand"],
    computed: {
        isExpanded() {
            return this.expanded;
        },
        status() {
            return getFluentServiceStatusForMonitor(this.monitor.id, this.$root);
        },
        uptimeText() {
            const uptimeType = this.publicHistoryDays > 0 ? String(this.publicHistoryDays) : "24";
            const key = `${this.monitor.id}_${uptimeType}`;
            if (this.$root.uptimeList[key] !== undefined) {
                let result = Math.round(this.$root.uptimeList[key] * 10000) / 100;
                if (this.$route.path.startsWith("/status") && result > 100) {
                    return "100%";
                }
                return `${result}%`;
            }
            return this.$t("notAvailableShort");
        },
        uptimePeriodLabel() {
            if (this.publicHistoryDays > 0) {
                return this.$t("publicHistoryDaysOption", [this.publicHistoryDays]);
            }
            return this.$t("statusPageFluentUptime24h");
        },
        hasMeta() {
            return (
                (this.showCertificateExpiry && this.monitor.certExpiryDaysRemaining) ||
                (this.showTags && this.monitor.tags?.length > 0)
            );
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
    methods: {
        toggleExpand() {
            if (this.editMode) {
                return;
            }
            this.$emit("toggle-expand", this.monitor.id);
        },
        tagDisplay(tag) {
            if (tag.value === "" || tag.value === undefined || tag.value === null) {
                return tag.name;
            }
            return `${tag.name}: ${tag.value}`;
        },
    },
};
</script>
