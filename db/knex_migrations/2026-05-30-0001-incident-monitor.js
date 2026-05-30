exports.up = function (knex) {
    return knex.schema.createTable("incident_monitor", function (table) {
        table.increments("id");
        table
            .integer("incident_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("incident")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        table.integer("monitor_id").unsigned().notNullable();
        table.unique(["incident_id", "monitor_id"]);
        table.index("monitor_id");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("incident_monitor");
};
