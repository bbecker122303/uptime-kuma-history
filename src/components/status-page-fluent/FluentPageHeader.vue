<template>
    <header class="fluent-page-header">
        <div class="fluent-title-row">
            <slot name="logo" />
            <h1 class="fluent-title">
                <slot name="title" />
            </h1>
        </div>
        <div v-if="$slots.actions" class="fluent-admin-actions">
            <slot name="actions" />
        </div>
    </header>
</template>
