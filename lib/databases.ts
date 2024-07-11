import knex from "knex";
import path from "path";

export const sqlite3 = knex({
  client: "better-sqlite3",
  connection: {
    filename: path.join(process.cwd(), "storage/data.sqlite"),
  },
  useNullAsDefault: true,
});
