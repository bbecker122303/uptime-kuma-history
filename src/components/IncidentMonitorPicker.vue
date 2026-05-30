<template>
    <div v-if="options.length > 0" class="mb-3">
        <label class="form-label">{{ $t("statusPageAffectedServices") }}</label>
        <VueMultiselect
            v-model="selected"
            :options="options"
            :multiple="true"
            :searchable="true"
            :close-on-select="false"
            :placeholder="$t('statusPageAffectedServicesPlaceholder')"
            label="name"
            track-by="id"
            data-testid="incident-monitor-select"
        />
        <div class="form-text">{{ $t("statusPageAffectedServicesDescription") }}</div>
    </div>
</template>

<script>
import VueMultiselect from "vue-multiselect";

export default {
    components: {
        VueMultiselect,
    },
    props: {
        modelValue: {
            type: Array,
            default: () => [],
        },
        options: {
            type: Array,
            default: () => [],
        },
    },
    emits: ["update:modelValue"],
    computed: {
        selected: {
            get() {
                const ids = new Set((this.modelValue || []).map((id) => Number(id)));
                return this.options.filter((monitor) => ids.has(monitor.id));
            },
            set(monitors) {
                this.$emit(
                    "update:modelValue",
                    (monitors || []).map((monitor) => monitor.id)
                );
            },
        },
    },
};
</script>
