<template>
    <div class="fluent-health-summary" :class="bannerClass">
        <p class="fluent-health-headline" data-testid="fluent-health-headline">{{ headline }}</p>
    </div>
</template>

<script>
export default {
    props: {
        headline: {
            type: String,
            required: true,
        },
        bannerClass: {
            type: String,
            default: "",
        },
    },
};
</script>
