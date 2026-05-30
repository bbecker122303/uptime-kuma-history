exports.up = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.text("theme_colors").nullable();
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("status_page", function (table) {
        table.dropColumn("theme_colors");
    });
};
