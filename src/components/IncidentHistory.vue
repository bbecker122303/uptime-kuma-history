<template>
    <div class="incident-group" :class="{ 'incident-group--fluent': fluent }" data-testid="incident-group">
        <div v-if="loading && incidents.length === 0" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">{{ $t("Loading...") }}</span>
            </div>
        </div>

        <div v-else-if="incidents.length === 0" class="text-center py-4 text-muted">
            {{ $t("No incidents recorded") }}
        </div>

        <div v-else class="incident-list">
            <div
                v-for="incident in incidents"
                :key="incident.id"
                class="incident-item"
                :class="[
                    { resolved: !incident.active },
                    fluent ? `fluent-incident-item fluent-incident-${incident.style || 'warning'}` : '',
                ]"
            >
                <div v-if="!fluent" class="incident-style-indicator" :class="`bg-${incident.style}`"></div>
                <div class="incident-body">
                    <div class="incident-header d-flex justify-content-between align-items-start">
                        <h5 class="incident-title mb-0">{{ incident.title }}</h5>
                        <div v-if="editMode" class="incident-actions">
                            <button
                                v-if="incident.active"
                                class="btn btn-sm me-1"
                                :class="fluent ? 'btn-light' : 'btn-success'"
                                :title="$t('Resolve')"
                                @click="$emit('resolve-incident', incident)"
                            >
                                <font-awesome-icon icon="check" />
                            </button>
                            <button
                                class="btn btn-sm me-1"
                                :class="fluent ? 'btn-light' : 'btn-outline-secondary'"
                                :title="$t('Edit')"
                                @click="$emit('edit-incident', incident)"
                            >
                                <font-awesome-icon icon="edit" />
                            </button>
                            <button
                                class="btn btn-sm"
                                :class="fluent ? 'btn-light text-danger' : 'btn-outline-danger'"
                                :title="$t('Delete')"
                                @click="$emit('delete-incident', incident)"
                            >
                                <font-awesome-icon icon="trash" />
                            </button>
                        </div>
                    </div>
                    <!-- eslint-disable-next-line vue/no-v-html-->
                    <div class="incident-content mt-1" v-html="getIncidentHTML(incident.content)"></div>
                    <div
                        v-if="affectedMonitors(incident).length > 0"
                        class="incident-affected-services mt-2"
                        data-testid="incident-affected-services"
                    >
                        <span class="incident-affected-label">{{ $t("statusPageAffectedServices") }}:</span>
                        <button
                            v-for="monitor in affectedMonitors(incident)"
                            :key="monitor.id"
                            type="button"
                            class="incident-service-link"
                            data-testid="incident-affected-service-link"
                            @click="goToMonitor(monitor.id)"
                        >
                            {{ monitor.name }}
                        </button>
                    </div>
                    <div class="incident-meta text-muted small mt-2">
                        <div>{{ $t("createdAt", { date: datetime(incident.createdDate) }) }}</div>
                        <div v-if="incident.lastUpdatedDate">
                            {{ $t("lastUpdatedAt", { date: datetime(incident.lastUpdatedDate) }) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { marked } from "marked";
import DOMPurify from "dompurify";
import datetimeMixin from "../mixins/datetime";

export default {
    name: "IncidentHistory",
    mixins: [datetimeMixin],
    props: {
        incidents: {
            type: Array,
            default: () => [],
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        fluent: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["edit-incident", "delete-incident", "resolve-incident"],
    methods: {
        /**
         * Monitors linked to this incident (public status page monitors only)
         * @param {object} incident Incident with monitorIds
         * @returns {{ id: number, name: string }[]}
         */
        affectedMonitors(incident) {
            const ids = incident.monitorIds || [];
            if (!ids.length || !this.$root.publicMonitorList) {
                return [];
            }

            return ids
                .map((id) => {
                    const monitor = this.$root.publicMonitorList[id];
                    if (!monitor) {
                        return null;
                    }
                    return { id: monitor.id, name: monitor.name };
                })
                .filter(Boolean);
        },

        /**
         * Scroll to a service row on the status page and expand linked outages when possible
         * @param {number} monitorId Monitor id
         * @returns {void}
         */
        goToMonitor(monitorId) {
            const row = document.querySelector(`[data-monitor-id="${monitorId}"]`);
            if (!row) {
                return;
            }

            row.scrollIntoView({ behavior: "smooth", block: "center" });

            const toggle = row.querySelector(
                '[data-testid="fluent-service-row-toggle"], [data-testid="classic-service-row-toggle"]'
            );
            if (toggle && toggle.getAttribute("aria-expanded") !== "true") {
                toggle.click();
            }
        },

        /**
         * Get sanitized HTML for incident content
         * @param {string} content - Markdown content
         * @returns {string} Sanitized HTML
         */
        getIncidentHTML(content) {
            if (content != null) {
                return DOMPurify.sanitize(marked(content));
            }
            return "";
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.incident-group {
    padding: 10px;

    .incident-list {
        .incident-item {
            display: flex;
            padding: 13px 15px 10px 15px;
            border-radius: 10px;
            transition: all ease-in-out 0.15s;

            &:hover {
                background-color: $highlight-white;
            }

            &.resolved {
                opacity: 0.7;
            }

            .incident-style-indicator {
                width: 6px;
                min-height: 100%;
                border-radius: 3px;
                flex-shrink: 0;
                margin-right: 12px;
            }

            .incident-body {
                flex: 1;
                min-width: 0;
            }

            .incident-meta {
                font-size: 12px;
            }

            .incident-affected-services {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.35rem 0.5rem;
            }

            .incident-affected-label {
                font-size: 0.75rem;
                font-weight: 600;
                color: #6c757d;
            }

            .incident-service-link {
                display: inline-block;
                padding: 0.125rem 0.5rem;
                font-size: 0.75rem;
                line-height: 1.3;
                color: $primary;
                background: transparent;
                border: 1px solid rgba(0, 0, 0, 0.12);
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;

                &:hover {
                    background: rgba(0, 0, 0, 0.04);
                    text-decoration: underline;
                }
            }
        }
    }
}

.dark {
    .incident-group {
        .incident-list {
            .incident-item {
                &:hover {
                    background-color: $dark-bg2;
                }
            }
        }
    }
}
</style>
