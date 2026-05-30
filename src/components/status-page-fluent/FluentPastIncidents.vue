<template>
    <section class="fluent-past-incidents mb-4" data-testid="fluent-past-incidents">
        <h2 class="fluent-section-title fluent-past-incidents-heading">{{ $t("Past Incidents") }}</h2>

        <div
            v-for="(dateGroup, dateKey) in groupedIncidentHistory"
            :key="dateKey"
            class="fluent-past-incidents-group"
        >
            <h3 class="fluent-past-incidents-date">{{ dateKey }}</h3>
            <div class="fluent-card fluent-past-incidents-card">
                <IncidentHistory
                    :incidents="dateGroup"
                    :edit-mode="editMode"
                    :loading="loading"
                    fluent
                    @edit-incident="$emit('edit-incident', $event)"
                    @delete-incident="$emit('delete-incident', $event)"
                    @resolve-incident="$emit('resolve-incident', $event)"
                />
            </div>
        </div>

        <div v-if="hasMore" class="fluent-past-incidents-load-more">
            <button
                type="button"
                class="btn btn-sm fluent-load-more-btn"
                :disabled="loading"
                data-testid="fluent-load-more-incidents"
                @click="$emit('load-more')"
            >
                <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                {{ $t("Load More") }}
            </button>
        </div>
    </section>
</template>

<script>
import IncidentHistory from "../IncidentHistory.vue";

export default {
    components: {
        IncidentHistory,
    },
    props: {
        groupedIncidentHistory: {
            type: Object,
            required: true,
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        hasMore: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["edit-incident", "delete-incident", "resolve-incident", "load-more"],
};
</script>
