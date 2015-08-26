/**
 * @namespace Accounts
 * @summary The namespace for all client-side accounts-related methods.
 */
Accounts = new AccountsClient();

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 */
Meteor.users = Accounts.users;
