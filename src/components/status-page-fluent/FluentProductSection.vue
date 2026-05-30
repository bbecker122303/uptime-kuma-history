<template>
    <section class="fluent-product-section" data-testid="group">
        <h2 class="fluent-section-title">
            <font-awesome-icon v-if="editMode && showGroupDrag" icon="arrows-alt-v" class="action drag" />
            <font-awesome-icon v-if="editMode" icon="times" class="action remove" @click="$emit('remove-group')" />
            <span v-if="!editMode" class="collapse-toggle" @click="$emit('toggle-collapse')">
                <font-awesome-icon icon="chevron-down" class="chevron" :class="{ collapsed: collapsed }" />
            </span>
            <Editable
                v-model="group.name"
                :contenteditable="editMode"
                tag="span"
                :class="{ 'collapse-toggle': !editMode }"
                data-testid="group-name"
                @click="!editMode && $emit('toggle-collapse')"
            />
        </h2>

        <div v-show="!collapsed" class="fluent-card">
            <div v-if="group.monitorList.length === 0" class="fluent-empty-monitors">
                {{ $t("No Monitors") }}
            </div>
            <slot v-else />
        </div>
    </section>
</template>

<script>
export default {
    props: {
        group: {
            type: Object,
            required: true,
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        showGroupDrag: {
            type: Boolean,
            default: false,
        },
        collapsed: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["remove-group", "toggle-collapse"],
};
</script>
