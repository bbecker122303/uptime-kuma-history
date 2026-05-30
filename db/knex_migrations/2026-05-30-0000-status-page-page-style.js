exports.up = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.string("page_style", 30).notNullable().defaultTo("classic");
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.dropColumn("page_style");
    });
};
