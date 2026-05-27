exports.up = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.integer("public_history_days").notNullable().defaultTo(0);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.dropColumn("public_history_days");
    });
};
