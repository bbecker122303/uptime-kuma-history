<template>
    <div class="fluent-shell" :style="cssVars">
        <slot />
    </div>
</template>

<script>
export default {
    props: {
        cssVars: {
            type: Object,
            default: () => ({}),
        },
    },
};
</script>

<style lang="scss">
@import "../../assets/status-page-fluent.scss";
</style>
