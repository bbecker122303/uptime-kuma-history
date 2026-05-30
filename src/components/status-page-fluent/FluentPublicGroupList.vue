<template>
    <Draggable
        v-model="$root.publicGroupList"
        :disabled="!editMode"
        item-key="id"
        :animation="100"
    >
        <template #item="group">
            <FluentProductSection
                :group="group.element"
                :edit-mode="editMode"
                :show-group-drag="showGroupDrag"
                :collapsed="isGroupCollapsed(group.element)"
                @remove-group="removeGroup(group.index)"
                @toggle-collapse="toggleGroup(group.element)"
            >
                <Draggable
                    v-model="group.element.monitorList"
                    class="fluent-monitor-list"
                    group="same-group"
                    :disabled="!editMode"
                    :animation="100"
                    item-key="id"
                >
                    <template #item="monitor">
                        <FluentServiceRow
                            :monitor="monitor.element"
                            :edit-mode="editMode"
                            :show-link="showLink(monitor)"
                            :show-tags="showTags"
                            :show-certificate-expiry="showCertificateExpiry"
                            :public-history-days="publicHistoryDays"
                            :linked-incidents="incidentsForMonitor(monitor.element.id)"
                            :expanded="expandedMonitorId === monitor.element.id"
                            @toggle-expand="onToggleExpand"
                            @remove="removeMonitor(group.index, monitor.index)"
                            @open-settings="$refs.monitorSettingDialog.show(group, monitor)"
                        />
                    </template>
                </Draggable>
            </FluentProductSection>
        </template>
    </Draggable>
    <MonitorSettingDialog ref="monitorSettingDialog" />
</template>

<script>
import Draggable from "vuedraggable";
import MonitorSettingDialog from "../MonitorSettingDialog.vue";
import FluentProductSection from "./FluentProductSection.vue";
import FluentServiceRow from "./FluentServiceRow.vue";

export default {
    components: {
        Draggable,
        MonitorSettingDialog,
        FluentProductSection,
        FluentServiceRow,
    },
    props: {
        editMode: {
            type: Boolean,
            required: true,
        },
        showTags: {
            type: Boolean,
        },
        showCertificateExpiry: {
            type: Boolean,
        },
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

        onToggleExpand(monitorId) {
            this.expandedMonitorId = this.expandedMonitorId === monitorId ? null : monitorId;
        },

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

        isGroupCollapsed(group) {
            return this.getCollapsedList().includes(this.getGroupIdentifier(group));
        },

        getCollapsedList() {
            const raw = this.$route.query.collapse;
            if (!raw) {
                return [];
            }
            return [].concat(raw);
        },

        removeGroup(index) {
            this.$root.publicGroupList.splice(index, 1);
        },

        removeMonitor(groupIndex, index) {
            const monitorId = this.$root.publicGroupList[groupIndex]?.monitorList[index]?.id;
            this.$root.publicGroupList[groupIndex].monitorList.splice(index, 1);
            if (this.expandedMonitorId === monitorId) {
                this.expandedMonitorId = null;
            }
        },

        showLink(monitor, ignoreSendUrl = false) {
            if (this.editMode && ignoreSendUrl && Object.keys(this.$root.monitorList).length) {
                return (
                    this.$root.monitorList[monitor.element.id].type === "http" ||
                    this.$root.monitorList[monitor.element.id].type === "keyword" ||
                    this.$root.monitorList[monitor.element.id].type === "json-query"
                );
            }
            return monitor.element.sendUrl && monitor.element.url && monitor.element.url !== "https://";
        },

        getGroupIdentifier(group) {
            if (group.id !== undefined && group.id !== null) {
                return group.id.toString();
            }
            return `group${this.$root.publicGroupList.indexOf(group)}`;
        },
    },
};
</script>
