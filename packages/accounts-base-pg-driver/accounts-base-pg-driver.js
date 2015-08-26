AccountsDBClientPG = class AccountsDBClientPG {
  constructor () {
    // This will throw an error saying we expect these tables to exist
    this.Users = new PG.Table("users");
    this.Services = new PG.Table("users_services");
  }

  insertUser() {
    const result = PG.await(this.Users.knex().insert({}).returning("id"));
    return result[0];
  }

  getUserById(id) {
    if (_.isString(id)) {
      id = parseInt(id, 10);
    }

    return this._getUserWhere({id: id});
  }

  _getUserWhere(where) {
    const userRow = this.Users.knex().where(where).run()[0];

    const createdAt = userRow.created_at;
    const _id = userRow.id;

    const fullUserDoc = {
      _id,
      createdAt
    };

    const serviceData = this._getServiceData(userRow.id);

    // accounts-password somehow needs to be able to register more fields to add
    // here, like emails and username
    // XXX but for now we hard-code it
    if (serviceData.password && serviceData.password.username) {
      fullUserDoc.username = serviceData.password.username;
    }

    fullUserDoc.services = serviceData;
    fullUserDoc.services.resume = this._getResumeService(userRow.id);

    const emailRows = PG.await(PG.knex("users_emails")
      .where({user_id: userRow.id}));

    fullUserDoc.emails = _.map(emailRows, (row) => {
      return {
        address: row.address,
        verified: row.verified
      };
    });

    return fullUserDoc;
  }

  _getResumeService(userId) {
    const loginTokens = PG.await(PG.knex("users_services").where({
      user_id: userId,
      service_name: "resume",
      key: "loginTokens"
    }));

    const formattedLoginTokens = loginTokens.map((loginToken) => {
      return {
        hashedToken: loginToken.value,
        when: loginToken.created_at.getTime()
      }
    });

    return {
      loginTokens: formattedLoginTokens
    }
  }

  // Timestamp is optional
  insertHashedLoginToken(userId, token, timestamp) {
    PG.inTransaction(() => {
      PG.await(PG.knex("users_services").insert({
        user_id: userId,
        service_name: "resume",
        key: "loginTokens",
        value: token,
        id_if_not_unique: 0,
        created_at: new Date(timestamp)
      }));
    });
  }

  removeHashedLoginToken(userId, token) {
    PG.await(PG.knex("users_services").where({
      user_id: userId,
      service_name: "resume",
      key: "loginTokens",
      value: token
    }).delete());
  }

  // XXX should be in facebook package or something
  _getServiceData(userId) {
    const serviceDataRows = this.Services.knex().where({
      user_id: userId
    }).run();

    const serviceData = {};
    serviceDataRows.forEach((row) => {
      const serviceName = row.service_name;
      serviceData[serviceName] = serviceData[serviceName] || {};
      serviceData[serviceName][row.key] = row.value;
    });

    return serviceData;
  }

  deleteAllResumeTokens() {
    PG.await(PG.knex("users_services").where({
      service_name: "resume.loginTokens"
    }).delete());
  }

  _getUserIdByService(serviceName, serviceKey, serviceValue) {
    const userRow = PG.await(PG.knex
      .first("users.*")
      .from("users")
      .leftJoin("users_services", "users.id", "users_services.user_id")
      .where({
        "users_services.key": serviceKey,
        "users_services.value": serviceValue,
        "users_services.service_name": serviceName
      }));

    return userRow && userRow.id;
  }

  getUserByServiceIdAndName(serviceName, serviceId) {
    const userId = this._getUserIdByService(serviceName, "id", serviceId);
    return userId && this.getUserById(userId);
  }

  getUserByHashedLoginToken(hashedToken) {
    const userId = this._getUserIdByService("resume", "loginTokens", hashedToken);
    return userId && this.getUserById(userId);
  }

  // Insert a user, passing it in as a complete JSON blob...
  // XXX make sure that if transaction fails we know there was a problem
  insertUserDoc(fullUserDoc) {
    fullUserDoc = _.clone(fullUserDoc);

    // Since we have a schema, we can't support any kind of field...
    check(fullUserDoc, {
      username: Match.Optional(String),
      services: Match.Optional(Object),
      emails: Match.Optional([
        { address: String, verified: Match.Optional(Boolean) }
      ])
    });

    fullUserDoc.services = fullUserDoc.services || {};

    // accounts-password should really be a service, so we will move
    // username to a service field
    if (fullUserDoc.username) {
      fullUserDoc.services.password = fullUserDoc.services.password || {};
      fullUserDoc.services.password.username = fullUserDoc.username;
    }

    let userId;
    PG.inTransaction(() => {
      userId = this.insertUser();

      if (! _.isEmpty(fullUserDoc.emails)) {
        fullUserDoc.emails.forEach((email) => {
          email = _.clone(email);
          email.user_id = userId;
          PG.await(PG.knex("users_emails").insert(email));
        });
      }

      if (! _.isEmpty(fullUserDoc.services)) {
        Object.keys(fullUserDoc.services).forEach((serviceName) => {
          this._insertServiceRecords(
            serviceName,
            fullUserDoc.services[serviceName],
            userId
          );
        });
      }
    });

    return userId;
  }

  setServiceData(userId, serviceData) {
    // XXX THIS SHOULD BE AN UPSERT
    // but this is a spike so I am not implementing it - Sashko

    // PG.wrapWithTransaction(() => {
    //   Object.keys(serviceData).forEach((serviceName) => {
    //     this._insertServiceRecords(
    //       serviceName,
    //       serviceData[serviceName],
    //       userId
    //     );
    //   });
    // })();
  }

  _insertServiceRecords(serviceName, serviceData, userId) {
    const serviceRecords = Object.keys(serviceData).map((key) => {
      const value = serviceData[key];

      // Currently, the schema assumes this is a string
      check(value, String);

      const record = {
        user_id: userId,
        service_name: serviceName,
        key,
        value
      };

      if (serviceName === "password" && key === "username") {
        record.id_if_not_unique = 0;
      }

      return record;
    });

    serviceRecords.forEach((record) => {
      try {
        PG.await(PG.knex("users_services").insert(record));
      } catch (error) {
        if (error.message.match(/duplicate key value/)) {
          throw new Error(`Key ${record.key} for login service ${serviceName} must be unique.`);
        } else {
          throw error;
        }
      }
    });
  }

  deleteUser(userId) {
    PG.await(PG.knex("users").where({id: userId}).delete());
  }
}

// AccountsDBClientPG.migrations = {};

// AccountsDBClientPG.migrations.up = function () {
//   PG.await(PG.knex.schema.createTable("users", (table) => {
//     table.increments(); // integer id

//     // XXX POSTGRES
//     table.timestamp("created_at").defaultTo(PG.knex.raw('now()')).notNullable();
//   }));

//   PG.await(PG.knex.schema.createTable("users_services", (table) => {
//     table.increments(); // integer id

//     // XXX POSTGRES
//     table.timestamp("created_at").defaultTo(PG.knex.raw('now()')).notNullable();

//     table.integer("user_id").notNullable();

//     table.string("service_name").notNullable();
//     table.string("key").notNullable();
//     table.string("value").notNullable();

//     // We are going to put a random ID here if this value is not meant to be
//     // unique across users
//     table.integer("id_if_not_unique").defaultTo(PG.knex.raw("nextval('users_services_id_seq')"));
//   }));

//   PG.await(PG.knex.schema.createTable("users_emails", (table) => {
//     table.increments(); // integer id

//     // XXX POSTGRES
//     table.timestamp("created_at").defaultTo(PG.knex.raw('now()')).notNullable();

//     table.integer("user_id").notNullable();
//     table.string("address").unique().notNullable();
//     table.boolean("verified").defaultTo(false).notNullable();
//   }));

//   // XXX POSTGRES
//   PG.await(PG.knex.raw("ALTER TABLE users_services ADD CONSTRAINT skvi UNIQUE (service_name, key, value, id_if_not_unique);"));
// };

// AccountsDBClientPG.migrations.down = function () {
//   PG.await(PG.knex.schema.dropTable("users"));
//   PG.await(PG.knex.schema.dropTable("users_services"));
//   PG.await(PG.knex.schema.dropTable("users_emails"));
// };

// Migrations.add({
//   version: 1,
//   name: 'Create Accounts database',
//   up: PG.wrapWithTransaction(AccountsDBClientPG.migrations.up),
//   down: PG.wrapWithTransaction(AccountsDBClientPG.migrations.down)
// });

// //Migrations.runIfEnvSet("ACCOUNTS_MIGRATIONS");
