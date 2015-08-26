
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable("users", function (table) {
      table.increments(); // integer id

      // XXX POSTGRES
      table.timestamp("created_at").defaultTo(knex.raw('now()')).notNullable();
      table.string("name").nullable();
      table.string("username").defaultTo('rodrigo').nullable();
      table.boolean("active").defaultTo(true).notNullable();
    }),

    knex.schema.createTable("users_services", function (table) {
      table.increments(); // integer id

      // XXX POSTGRES
      table.timestamp("created_at").defaultTo(knex.raw('now()')).notNullable();

      table.integer("user_id").notNullable();

      table.string("service_name").notNullable();
      table.string("key").notNullable();
      table.string("value").notNullable();

      // We are going to put a random ID here if this value is not meant to be
      // unique across users
      table.integer("id_if_not_unique").defaultTo(knex.raw("nextval('users_services_id_seq')"));
    }),

    knex.schema.createTable("users_emails", function (table) {
      table.increments(); // integer id

      // XXX POSTGRES
      table.timestamp("created_at").defaultTo(knex.raw('now()')).notNullable();

      table.integer("user_id").notNullable();
      table.string("address").unique().notNullable();
      table.boolean("verified").defaultTo(false).notNullable();
    }),

    knex.raw("ALTER TABLE users_services ADD CONSTRAINT skvi UNIQUE (service_name, key, value, id_if_not_unique);")
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable("users"),
    knex.schema.dropTable("users_services"),
    knex.schema.dropTable("users_emails")
  ]);
};
