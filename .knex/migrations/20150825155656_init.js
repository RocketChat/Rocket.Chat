exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.createTable("rocketchat_room", function (table) {
			table.increments(); // integer id

			table.string('_id').notNullable();

			table.timestamp('ts').defaultTo(knex.raw('now()')).notNullable();
			table.enu('t', ['p', 'c', 'd']).notNullable();
			table.string('name').nullable();
			table.timestamp('lm').nullable();
			table.integer("msgs").defaultTo(0).notNullable();
			table.boolean("cl").defaultTo(true).notNullable();
			table.boolean("default").defaultTo(false).notNullable();
			table.json("usernames", true).nullable();
			table.json("u").nullable();

			// "usernames": []                            // Array(String)    Room Users
			// "u": {                                     // Object           Owner User
			// 	"_id": "CABrXSHpDqbZXGkYR",            // Random.id()      User Id
			// 	"username": "john"                     // String           User Username
			// }
		}),

		knex.schema.createTable("rocketchat_subscription", function (table) {
			table.increments(); // integer id

			table.enu('t', ['p', 'c', 'd']).notNullable();
			table.timestamp('ts').defaultTo(knex.raw('now()')).notNullable();
			table.timestamp('ls').nullable();
			table.string('name').nullable();
			table.string('rid').notNullable();
			table.boolean("f").defaultTo(false).notNullable();
			table.boolean("open").defaultTo(true).notNullable();
			table.boolean("alert").defaultTo(false).notNullable();
			table.integer("unread").defaultTo(0).notNullable();
			table.json("u").notNullable();

			// "u": {                                     // Object           User
			// 	"_id": "CABrXSHpDqbZXGkYR",            // Random.id()      User Id
			// 	"username": "liam"                     // String           User Username
			// }
		}),

		knex.schema.createTable("rocketchat_message", function (table) {
			table.increments(); // integer id

			table.enu('t', ['p', 'c', 'd']).notNullable();
			table.timestamp('ts').defaultTo(knex.raw('now()')).notNullable();
			table.string('rid').notNullable();
			table.text('msg').notNullable();
			table.json("url").nullable();
			table.json("mentions").nullable();
			table.json("u").notNullable();

			// "url": [                                   // Array(String)    Message URLs
			// 	"http://google.com/"
			// ],
			// "mentions": [                              // Array(String)    Mentioned Usernames
			// 	"username1"
			// ],
			// "u": {                                     // Object           User
			// 	"_id": "CABrXSHpDqbZXGkYR",            // Random.id()      User Id
			// 	"username": "john"                     // String           User Username
			// }
		}),

		knex.schema.createTable("rocketchat_mr_statistics", function (table) {
			table.increments(); // integer id
		}),

		knex.schema.createTable("rocketchat_statistics", function (table) {
			table.increments(); // integer id
		}),

		knex.schema.createTable("rocketchat_reports", function (table) {
			table.increments(); // integer id
		}),

		knex.schema.createTable("rocketchat_settings", function (table) {
			table.increments(); // integer id
		}),
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.dropTable("rocketchat_room"),
		knex.schema.dropTable("rocketchat_subscription"),
		knex.schema.dropTable("rocketchat_message"),
		knex.schema.dropTable("rocketchat_mr_statistics"),
		knex.schema.dropTable("rocketchat_statistics"),
		knex.schema.dropTable("rocketchat_reports"),
		knex.schema.dropTable("rocketchat_settings")
	]);
};