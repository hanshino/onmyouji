/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("user", (table) => {
    table.increments("id").primary();
    table.string("line_id").notNullable().unique();
    table.string("display_name").notNullable();
    table.string("picture_url").notNullable();
    table.string("status_message");
    table.timestamps(true, true);

    table.index(["line_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("user");
};
