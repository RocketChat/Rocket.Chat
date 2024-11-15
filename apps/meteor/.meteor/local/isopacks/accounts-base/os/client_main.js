import {
  AccountsClient,
  AccountsTest,
} from "./accounts_client.js";

/**
 * @namespace Accounts
 * @summary The namespace for all client-side accounts-related methods.
 */
Accounts = new AccountsClient(Meteor.settings?.public?.packages?.accounts || {});

/**
 * @summary A [Mongo.Collection](#collections) containing user documents.
 * @locus Anywhere
 * @type {Mongo.Collection}
 * @importFromPackage meteor
 */
Meteor.users = Accounts.users;

export {
  Accounts,
  AccountsClient,
  AccountsTest,
  // For backwards compatibility. Note that exporting an object as the
  // default export is *not* the same as exporting its properties as named
  // exports, as was previously assumed.
  exports as default,
};
