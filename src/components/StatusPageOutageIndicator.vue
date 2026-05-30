<template>
    <span
        v-if="count > 0"
        class="status-page-outage-indicator"
        :title="$t('statusPageOutageIndicatorTitle', [count])"
        data-testid="status-page-outage-indicator"
    >
        <font-awesome-icon icon="exclamation-circle" class="status-page-outage-icon" />
        <span class="status-page-outage-text">{{ $t("statusPageOutageIndicator", [count]) }}</span>
    </span>
</template>

<script>
export default {
    props: {
        count: {
            type: Number,
            default: 0,
        },
    },
};
</script>

<style lang="scss" scoped>
.status-page-outage-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-right: 0.45rem;
    padding: 0.1rem 0.45rem;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.3;
    color: #8a6914;
    background: rgba(202, 80, 16, 0.08);
    border: 1px solid rgba(202, 80, 16, 0.22);
    border-radius: 999px;
    vertical-align: middle;

    body.dark & {
        color: #f3d6c3;
        background: rgba(202, 80, 16, 0.18);
        border-color: rgba(202, 80, 16, 0.35);
    }
}

.status-page-outage-icon {
    font-size: 0.7rem;
    opacity: 0.9;
}

.status-page-outage-text {
    white-space: nowrap;
}
</style>
