<template>
    <StatusPageLinkedOutages :incidents="incidents" />
</template>

<script>
import StatusPageLinkedOutages from "../StatusPageLinkedOutages.vue";

export default {
    components: {
        StatusPageLinkedOutages,
    },
    props: {
        incidents: {
            type: Array,
            default: () => [],
        },
    },
};
</script>
