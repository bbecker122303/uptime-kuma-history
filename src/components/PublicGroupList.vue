<template>
    <!-- Group List -->
    <Draggable v-model="$root.publicGroupList" :disabled="!editMode" item-key="id" :animation="100">
        <template #item="group">
            <div class="mb-5" data-testid="group">
                <!-- Group Title -->
                <h2 class="group-title">
                    <font-awesome-icon v-if="editMode && showGroupDrag" icon="arrows-alt-v" class="action drag me-3" />
                    <font-awesome-icon
                        v-if="editMode"
                        icon="times"
                        class="action remove me-3"
                        @click="removeGroup(group.index)"
                    />
                    <span class="collapse-toggle" @click="toggleGroup(group.element)">
                        <font-awesome-icon
                            icon="chevron-down"
                            class="chevron me-2"
                            :class="{ collapsed: isGroupCollapsed(group.element) }"
                        />
                    </span>
                    <Editable
                        v-model="group.element.name"
                        :contenteditable="editMode"
                        tag="span"
                        :class="{ 'collapse-toggle': !editMode }"
                        data-testid="group-name"
                        @click="!editMode && toggleGroup(group.element)"
                    />
                </h2>

                <transition name="slide-fade-up">
                    <div v-if="!isGroupCollapsed(group.element)" class="shadow-box monitor-list mt-4 position-relative">
                        <div v-if="group.element.monitorList.length === 0" class="text-center no-monitor-msg">
                            {{ $t("No Monitors") }}
                        </div>

                        <!-- Monitor List -->
                        <!-- animation is not working, no idea why -->
                        <Draggable
                            v-model="group.element.monitorList"
                            class="monitor-list"
                            group="same-group"
                            :disabled="!editMode"
                            :animation="100"
                            item-key="id"
                        >
                            <template #item="monitor">
                                <div
                                    class="item"
                                    :class="{ 'is-expanded': expandedMonitorId === monitor.element.id }"
                                    data-testid="monitor"
                                    :data-monitor-id="monitor.element.id"
                                >
                                    <div
                                        class="monitor-row-header"
                                        :class="{
                                            expanded: expandedMonitorId === monitor.element.id,
                                            'has-linked-outages':
                                                !editMode && incidentsForMonitor(monitor.element.id).length > 0,
                                        }"
                                        :role="
                                            editMode || incidentsForMonitor(monitor.element.id).length === 0
                                                ? undefined
                                                : 'button'
                                        "
                                        :tabindex="
                                            editMode || incidentsForMonitor(monitor.element.id).length === 0
                                                ? undefined
                                                : 0
                                        "
                                        :aria-expanded="
                                            editMode || incidentsForMonitor(monitor.element.id).length === 0
                                                ? undefined
                                                : expandedMonitorId === monitor.element.id
                                        "
                                        data-testid="classic-service-row-toggle"
                                        @click="onMonitorRowClick(monitor.element.id)"
                                        @keydown.enter.prevent="onMonitorRowClick(monitor.element.id)"
                                        @keydown.space.prevent="onMonitorRowClick(monitor.element.id)"
                                    >
                                        <div class="row">
                                            <div class="col-9 col-xl-6 small-padding">
                                                <div class="info">
                                                    <font-awesome-icon
                                                        v-if="
                                                            !editMode &&
                                                            incidentsForMonitor(monitor.element.id).length > 0
                                                        "
                                                        icon="chevron-right"
                                                        class="monitor-expand-icon me-2"
                                                    />
                                                    <font-awesome-icon
                                                        v-if="editMode"
                                                        icon="arrows-alt-v"
                                                        class="action drag me-3"
                                                        @click.stop
                                                    />
                                                    <font-awesome-icon
                                                        v-if="editMode"
                                                        icon="times"
                                                        class="action remove me-3"
                                                        @click.stop="removeMonitor(group.index, monitor.index)"
                                                    />

                                                    <font-awesome-icon
                                                        v-if="editMode"
                                                        icon="cog"
                                                        class="action me-3 ms-0"
                                                        :class="{ 'link-active': true, 'btn-link': true }"
                                                        data-testid="monitor-settings"
                                                        @click.stop="$refs.monitorSettingDialog.show(group, monitor)"
                                                    />
                                                    <Status
                                                        v-if="showOnlyLastHeartbeat"
                                                        :status="statusOfLastHeartbeat(monitor.element.id)"
                                                    />
                                                    <Uptime
                                                        v-else
                                                        :monitor="monitor.element"
                                                        :type="uptimeType"
                                                        :pill="true"
                                                    />
                                                    <a
                                                        v-if="showLink(monitor)"
                                                        :href="monitor.element.url"
                                                        class="item-name"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        data-testid="monitor-name"
                                                        @click.stop
                                                    >
                                                        {{ monitor.element.name }}
                                                    </a>
                                                    <p v-else class="item-name" data-testid="monitor-name">
                                                        {{ monitor.element.name }}
                                                    </p>
                                                    <StatusPageOutageIndicator
                                                        v-if="
                                                            !editMode &&
                                                            incidentsForMonitor(monitor.element.id).length > 0
                                                        "
                                                        class="classic-notices-after-name"
                                                        :count="incidentsForMonitor(monitor.element.id).length"
                                                    />
                                                </div>
                                                <div class="extra-info" @click.stop>
                                                    <div
                                                        v-if="
                                                            showCertificateExpiry &&
                                                            monitor.element.certExpiryDaysRemaining
                                                        "
                                                    >
                                                        <Tag
                                                            :item="{
                                                                name: $t('Cert Exp.'),
                                                                value: formattedCertExpiryMessage(monitor),
                                                                color: certExpiryColor(monitor),
                                                            }"
                                                            :size="'sm'"
                                                        />
                                                    </div>
                                                    <div v-if="showTags">
                                                        <Tag
                                                            v-for="tag in monitor.element.tags"
                                                            :key="tag"
                                                            :item="tag"
                                                            :size="'sm'"
                                                            data-testid="monitor-tag"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div :key="$root.userHeartbeatBar" class="col-3 col-xl-6">
                                                <HeartbeatBar
                                                    size="mid"
                                                    :monitor-id="monitor.element.id"
                                                    :heartbeat-bar-days="publicHistoryDays"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-show="expandedMonitorId === monitor.element.id"
                                        class="classic-monitor-expanded"
                                        data-testid="classic-service-expanded"
                                    >
                                        <StatusPageLinkedOutages
                                            :incidents="incidentsForMonitor(monitor.element.id)"
                                        />
                                    </div>
                                </div>
                            </template>
                        </Draggable>
                    </div>
                </transition>
            </div>
        </template>
    </Draggable>
    <MonitorSettingDialog ref="monitorSettingDialog" />
</template>

<script>
import MonitorSettingDialog from "./MonitorSettingDialog.vue";
import Draggable from "vuedraggable";
import HeartbeatBar from "./HeartbeatBar.vue";
import Uptime from "./Uptime.vue";
import Tag from "./Tag.vue";
import Status from "./Status.vue";
import StatusPageLinkedOutages from "./StatusPageLinkedOutages.vue";
import StatusPageOutageIndicator from "./StatusPageOutageIndicator.vue";

export default {
    components: {
        MonitorSettingDialog,
        Draggable,
        HeartbeatBar,
        Uptime,
        Tag,
        Status,
        StatusPageLinkedOutages,
        StatusPageOutageIndicator,
    },
    props: {
        /** Are we in edit mode? */
        editMode: {
            type: Boolean,
            required: true,
        },
        /** Should tags be shown? */
        showTags: {
            type: Boolean,
        },
        /** Should expiry be shown? */
        showCertificateExpiry: {
            type: Boolean,
        },
        /** Should only the last heartbeat be shown? */
        showOnlyLastHeartbeat: {
            type: Boolean,
        },
        /** How many days of history to show on the public page (0 = default) */
        publicHistoryDays: {
            type: Number,
            default: 0,
        },
        incidentHistory: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            expandedMonitorId: null,
        };
    },
    computed: {
        showGroupDrag() {
            return this.$root.publicGroupList.length >= 2;
        },
        uptimeType() {
            if (this.publicHistoryDays > 0) {
                return String(this.publicHistoryDays);
            }
            return "24";
        },
    },
    methods: {
        incidentsForMonitor(monitorId) {
            const linked = (this.incidentHistory || []).filter(
                (incident) => Array.isArray(incident.monitorIds) && incident.monitorIds.includes(monitorId)
            );
            const active = linked.filter((incident) => incident.active && incident.pin);
            const past = linked.filter((incident) => !(incident.active && incident.pin));
            return [...active, ...past];
        },

        onMonitorRowClick(monitorId) {
            if (this.editMode) {
                return;
            }
            if (this.incidentsForMonitor(monitorId).length === 0) {
                return;
            }
            this.expandedMonitorId = this.expandedMonitorId === monitorId ? null : monitorId;
        },

        /**
         * Toggle collapsed state for a group
         * @param {object} group Group to toggle
         * @returns {void}
         */
        toggleGroup(group) {
            if (!this.$router) {
                return;
            }

            const groupId = this.getGroupIdentifier(group);
            const collapsed = this.getCollapsedList();
            const index = collapsed.indexOf(groupId);

            if (index >= 0) {
                collapsed.splice(index, 1);
            } else {
                collapsed.push(groupId);
            }

            const query = { ...this.$route.query };
            if (collapsed.length > 0) {
                query.collapse = collapsed;
            } else {
                delete query.collapse;
            }

            this.$router.push({ query }).catch(() => {});
        },

        /**
         * Check if a group is collapsed
         * @param {object} group Group to check
         * @returns {boolean} Whether the group is collapsed
         */
        isGroupCollapsed(group) {
            return this.getCollapsedList().includes(this.getGroupIdentifier(group));
        },

        /**
         * Get list of collapsed group identifiers from the query param.
         * Vue Router normalises repeated params (?collapse=1&collapse=2) into an array.
         * @returns {string[]} Collapsed group identifiers
         */
        getCollapsedList() {
            const raw = this.$route.query.collapse;
            if (!raw) {
                return [];
            }
            // Normalise to array: a single query param is a string, repeated params are already an array
            return [].concat(raw);
        },

        /**
         * Remove the specified group
         * @param {number} index Index of group to remove
         * @returns {void}
         */
        removeGroup(index) {
            this.$root.publicGroupList.splice(index, 1);
        },

        /**
         * Remove a monitor from a group
         * @param {number} groupIndex Index of group to remove monitor from
         * @param {number} index Index of monitor to remove
         * @returns {void}
         */
        removeMonitor(groupIndex, index) {
            const monitorId = this.$root.publicGroupList[groupIndex]?.monitorList[index]?.id;
            this.$root.publicGroupList[groupIndex].monitorList.splice(index, 1);
            if (this.expandedMonitorId === monitorId) {
                this.expandedMonitorId = null;
            }
        },

        /**
         * Should a link to the monitor be shown?
         * Attempts to guess if a link should be shown based upon if
         * sendUrl is set and if the URL is default or not.
         * @param {object} monitor Monitor to check
         * @param {boolean} ignoreSendUrl Should the presence of the sendUrl
         * property be ignored. This will only work in edit mode.
         * @returns {boolean} Should the link be shown
         */
        showLink(monitor, ignoreSendUrl = false) {
            // We must check if there are any elements in monitorList to
            // prevent undefined errors if it hasn't been loaded yet
            if (this.$parent.editMode && ignoreSendUrl && Object.keys(this.$root.monitorList).length) {
                return (
                    this.$root.monitorList[monitor.element.id].type === "http" ||
                    this.$root.monitorList[monitor.element.id].type === "keyword" ||
                    this.$root.monitorList[monitor.element.id].type === "json-query"
                );
            }
            return monitor.element.sendUrl && monitor.element.url && monitor.element.url !== "https://";
        },

        /**
         * Returns formatted certificate expiry or Bad cert message
         * @param {object} monitor Monitor to show expiry for
         * @returns {string} Certificate expiry message
         */
        formattedCertExpiryMessage(monitor) {
            if (monitor?.element?.validCert && monitor?.element?.certExpiryDaysRemaining) {
                return this.$t("days", monitor.element.certExpiryDaysRemaining);
            } else if (monitor?.element?.validCert === false) {
                return this.$t("noOrBadCertificate");
            } else {
                return this.$t("unknownDays");
            }
        },

        /**
         * Returns the status of the last heartbeat
         * @param {number} monitorId Id of the monitor to get status for
         * @returns {number} Status of the last heartbeat
         */
        statusOfLastHeartbeat(monitorId) {
            let heartbeats = this.$root.heartbeatList[monitorId] ?? [];
            let lastHeartbeat = heartbeats[heartbeats.length - 1];
            return lastHeartbeat?.status;
        },

        /**
         * Returns certificate expiry color based on days remaining
         * @param {object} monitor Monitor to show expiry for
         * @returns {string} Color for certificate expiry
         */
        certExpiryColor(monitor) {
            if (monitor?.element?.validCert && monitor.element.certExpiryDaysRemaining > 7) {
                return "#059669";
            }
            return "#DC2626";
        },

        /**
         * Get unique identifier for a group
         * @param {object} group object
         * @returns {string} group identifier
         */
        getGroupIdentifier(group) {
            if (group.id !== undefined && group.id !== null) {
                return group.id.toString();
            }
            return `group${this.$root.publicGroupList.indexOf(group)}`;
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.extra-info {
    display: flex;
    margin-bottom: 0.5rem;
}

.extra-info > div > div:first-child {
    margin-left: 0 !important;
}

.no-monitor-msg {
    position: absolute;
    width: 100%;
    top: 20px;
    left: 0;
}

.monitor-list {
    min-height: 46px;
}

.item-name {
    padding-left: 5px;
    padding-right: 5px;
    margin: 0;
    display: inline-block;
}

.info :deep(.classic-notices-after-name) {
    margin-right: 0;
    margin-left: 0.5rem;
}

.btn-link {
    color: #bbbbbb;
    margin-left: 5px;
}

.link-active {
    color: $primary;
}

.flip-list-move {
    transition: transform 0.5s;
}

.no-move {
    transition: transform 0s;
}

.drag {
    color: #bbb;
    cursor: grab;
}

.remove {
    color: $danger;
}

.group-title {
    span {
        display: inline-block;
        min-width: 15px;
    }
}

.collapse-toggle {
    cursor: pointer;
    padding: 2px;
}

.chevron {
    font-size: 0.8em;
    color: #bbb;
    transition: all 0.2s $easing-in;

    &.collapsed {
        transform: rotate(-90deg);
    }
}

.mobile {
    .item {
        padding: 13px 0 10px;
    }
}

.bg-maintenance {
    background-color: $maintenance;
}

.monitor-row-header.has-linked-outages {
    cursor: pointer;
    user-select: none;

    &:hover {
        background: rgba(0, 0, 0, 0.03);
    }

    body.dark & {
        &:hover {
            background: rgba(255, 255, 255, 0.04);
        }
    }

    &.expanded .monitor-expand-icon {
        transform: rotate(90deg);
    }
}

.monitor-expand-icon {
    font-size: 0.7rem;
    color: #bbb;
    transition: transform 0.2s $easing-in;
}

.classic-monitor-expanded {
    padding: 0.75rem 1rem 1rem 2rem;
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    body.dark & {
        border-top-color: rgba(255, 255, 255, 0.08);
    }
}
</style>
