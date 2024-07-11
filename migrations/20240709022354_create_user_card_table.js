/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("user_cards", (table) => {
    table.increments("id").primary();
    table.string("line_id").notNullable();
    table.string("card_url").notNullable().comment("The URL of the card image");
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("user_cards");
};
