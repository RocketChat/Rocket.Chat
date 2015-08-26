/**
 * @namespace Accounts
 * @summary The namespace for all server-side accounts-related methods.
 */
Accounts = new AccountsServer(Meteor.server);

// Users table. Don't use the normal autopublish, since we want to hide
// some fields. Code to autopublish this is in accounts_server.js.
// XXX Allow users to configure this collection name.

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 */
Meteor.users = Accounts.users;
