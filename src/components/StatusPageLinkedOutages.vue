<template>
    <div v-if="incidents.length > 0" class="status-page-linked-outages">
        <h3 class="status-page-outages-heading">{{ $t("statusPageLinkedOutages") }}</h3>
        <div
            v-for="item in incidents"
            :key="item.id"
            class="status-page-outage-item"
            :class="'status-page-outage-' + (item.style || 'warning')"
            data-testid="status-page-linked-incident"
        >
            <div class="status-page-outage-title">{{ item.title }}</div>
            <div class="status-page-outage-content" v-html="incidentHTML(item.content)"></div>
            <div v-if="item.lastUpdatedDate || item.createdDate" class="status-page-outage-date">
                {{
                    $t("lastUpdatedAtFromNow", {
                        date: $root.datetime(item.lastUpdatedDate || item.createdDate),
                        fromNow: fromNow(item.lastUpdatedDate || item.createdDate),
                    })
                }}
            </div>
        </div>
    </div>
</template>

<script>
import { marked } from "marked";
import DOMPurify from "dompurify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default {
    props: {
        incidents: {
            type: Array,
            default: () => [],
        },
    },
    methods: {
        incidentHTML(content) {
            return DOMPurify.sanitize(marked(content || ""));
        },
        fromNow(date) {
            return dayjs.utc(date).fromNow();
        },
    },
};
</script>

<style lang="scss" scoped>
.status-page-linked-outages {
    margin-bottom: 1rem;
}

.status-page-outages-heading {
    font-size: 0.8125rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--sp-text-secondary, #605e5c);
    margin: 0 0 0.5rem;
}

.status-page-outage-item {
    padding: 0.75rem 0.875rem;
    margin-bottom: 0.5rem;
    border: 1px solid var(--sp-card-border, #edebe9);
    border-radius: var(--sp-radius, 4px);
    background: var(--sp-card, #fff);

    &:last-child {
        margin-bottom: 0;
    }
}

.status-page-outage-warning {
    border-left: 4px solid var(--sp-warning, #ca5010);
}

.status-page-outage-danger {
    border-left: 4px solid var(--sp-danger, #d13438);
}

.status-page-outage-info {
    border-left: 4px solid var(--sp-primary, #0078d4);
}

.status-page-outage-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--sp-text, #242424);
    margin-bottom: 0.35rem;
}

.status-page-outage-content {
    font-size: 0.875rem;
    color: var(--sp-text-secondary, #605e5c);
    line-height: 1.45;

    :deep(p:last-child) {
        margin-bottom: 0;
    }
}

.status-page-outage-date {
    font-size: 0.75rem;
    color: var(--sp-text-secondary, #605e5c);
    margin-top: 0.5rem;
}
</style>
