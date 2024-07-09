// Update with your config settings.
const path = require("path");
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: "better-sqlite3",
  connection: {
    filename: path.resolve(process.cwd(), "data.sqlite"),
  },
  useNullAsDefault: true,
};
