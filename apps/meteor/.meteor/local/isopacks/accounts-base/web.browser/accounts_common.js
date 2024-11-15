import { Meteor } from 'meteor/meteor';

// config option keys
const VALID_CONFIG_KEYS = [
  'sendVerificationEmail',
  'forbidClientAccountCreation',
  'restrictCreationByEmailDomain',
  'loginExpiration',
  'loginExpirationInDays',
  'oauthSecretKey',
  'passwordResetTokenExpirationInDays',
  'passwordResetTokenExpiration',
  'passwordEnrollTokenExpirationInDays',
  'passwordEnrollTokenExpiration',
  'ambiguousErrorMessages',
  'bcryptRounds',
  'defaultFieldSelector',
  'collection',
  'loginTokenExpirationHours',
  'tokenSequenceLength',
  'clientStorage',
  'ddpUrl',
  'connection',
];

/**
 * @summary Super-constructor for AccountsClient and AccountsServer.
 * @locus Anywhere
 * @class AccountsCommon
 * @instancename accountsClientOrServer
 * @param options {Object} an object with fields:
 * - connection {Object} Optional DDP connection to reuse.
 * - ddpUrl {String} Optional URL for creating a new DDP connection.
 * - collection {String|Mongo.Collection} The name of the Mongo.Collection
 *     or the Mongo.Collection object to hold the users.
 */
export class AccountsCommon {
  constructor(options) {
    // Validate config options keys
    for (const key of Object.keys(options)) {
      if (!VALID_CONFIG_KEYS.includes(key)) {
        console.error(`Accounts.config: Invalid key: ${key}`);
      }
    }

    // Currently this is read directly by packages like accounts-password
    // and accounts-ui-unstyled.
    this._options = options || {};

    // Note that setting this.connection = null causes this.users to be a
    // LocalCollection, which is not what we want.
    this.connection = undefined;
    this._initConnection(options || {});

    // There is an allow call in accounts_server.js that restricts writes to
    // this collection.
    this.users = this._initializeCollection(options || {});

    // Callback exceptions are printed with Meteor._debug and ignored.
    this._onLoginHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLogin callback',
    });

    this._onLoginFailureHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLoginFailure callback',
    });

    this._onLogoutHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLogout callback',
    });

    // Expose for testing.
    this.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;
    this.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS;

    // Thrown when the user cancels the login process (eg, closes an oauth
    // popup, declines retina scan, etc)
    const lceName = 'Accounts.LoginCancelledError';
    this.LoginCancelledError = Meteor.makeErrorType(lceName, function(
      description
    ) {
      this.message = description;
    });
    this.LoginCancelledError.prototype.name = lceName;

    // This is used to transmit specific subclass errors over the wire. We
    // should come up with a more generic way to do this (eg, with some sort of
    // symbolic error code rather than a number).
    this.LoginCancelledError.numericError = 0x8acdc2f;
  }

  _initializeCollection(options) {
    if (options.collection && typeof options.collection !== 'string' && !(options.collection instanceof Mongo.Collection)) {
      throw new Meteor.Error('Collection parameter can be only of type string or "Mongo.Collection"');
    }

    let collectionName = 'users';
    if (typeof options.collection === 'string') {
      collectionName = options.collection;
    }

    let collection;
    if (options.collection instanceof Mongo.Collection) {
      collection = options.collection;
    } else {
      collection = new Mongo.Collection(collectionName, {
        _preventAutopublish: true,
        connection: this.connection,
      });
    }

    return collection;
  }

  /**
   * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */
  userId() {
    throw new Error('userId method not implemented');
  }

  // merge the defaultFieldSelector with an existing options object
  _addDefaultFieldSelector(options = {}) {
    // this will be the most common case for most people, so make it quick
    if (!this._options.defaultFieldSelector) return options;

    // if no field selector then just use defaultFieldSelector
    if (!options.fields)
      return {
        ...options,
        fields: this._options.defaultFieldSelector,
      };

    // if empty field selector then the full user object is explicitly requested, so obey
    const keys = Object.keys(options.fields);
    if (!keys.length) return options;

    // if the requested fields are +ve then ignore defaultFieldSelector
    // assume they are all either +ve or -ve because Mongo doesn't like mixed
    if (!!options.fields[keys[0]]) return options;

    // The requested fields are -ve.
    // If the defaultFieldSelector is +ve then use requested fields, otherwise merge them
    const keys2 = Object.keys(this._options.defaultFieldSelector);
    return this._options.defaultFieldSelector[keys2[0]]
      ? options
      : {
          ...options,
          fields: {
            ...options.fields,
            ...this._options.defaultFieldSelector,
          },
        };
  }

  /**
   * @summary Get the current user record, or `null` if no user is logged in. A reactive data source. In the server this fuction returns a promise.
   * @locus Anywhere
   * @param {Object} [options]
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   */
  user(options) {
    if (Meteor.isServer) {
      console.warn([
        "`Meteor.user()` is deprecated on the server side.",
        "    To fetch the current user record on the server,",
        "    use `Meteor.userAsync()` instead.",
      ].join("\n"));
    }

    const self = this;
    const userId = self.userId();
    const findOne = (...args) => Meteor.isClient
      ? self.users.findOne(...args)
      : self.users.findOneAsync(...args);
    return userId
      ? findOne(userId, this._addDefaultFieldSelector(options))
      : null;
  }

  /**
   * @summary Get the current user record, or `null` if no user is logged in.
   * @locus Anywhere
   * @param {Object} [options]
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   */
  async userAsync(options) {
    const userId = this.userId();
    return userId
      ? this.users.findOneAsync(userId, this._addDefaultFieldSelector(options))
      : null;
  }
  // Set up config for the accounts system. Call this on both the client
  // and the server.
  //
  // Note that this method gets overridden on AccountsServer.prototype, but
  // the overriding method calls the overridden method.
  //
  // XXX we should add some enforcement that this is called on both the
  // client and the server. Otherwise, a user can
  // 'forbidClientAccountCreation' only on the client and while it looks
  // like their app is secure, the server will still accept createUser
  // calls. https://github.com/meteor/meteor/issues/828
  //
  // @param options {Object} an object with fields:
  // - sendVerificationEmail {Boolean}
  //     Send email address verification emails to new users created from
  //     client signups.
  // - forbidClientAccountCreation {Boolean}
  //     Do not allow clients to create accounts directly.
  // - restrictCreationByEmailDomain {Function or String}
  //     Require created users to have an email matching the function or
  //     having the string as domain.
  // - loginExpirationInDays {Number}
  //     Number of days since login until a user is logged out (login token
  //     expires).
  // - collection {String|Mongo.Collection}
  //     A collection name or a Mongo.Collection object to hold the users.
  // - passwordResetTokenExpirationInDays {Number}
  //     Number of days since password reset token creation until the
  //     token can't be used any longer (password reset token expires).
  // - ambiguousErrorMessages {Boolean}
  //     Return ambiguous error messages from login failures to prevent
  //     user enumeration.
  // - bcryptRounds {Number}
  //     Allows override of number of bcrypt rounds (aka work factor) used
  //     to store passwords.

  /**
   * @summary Set global accounts options. You can also set these in `Meteor.settings.packages.accounts` without the need to call this function.
   * @locus Anywhere
   * @param {Object} options
   * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
   * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available.
   * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
   * @param {Number} options.loginExpiration The number of milliseconds from when a user logs in until their token expires and they are logged out, for a more granular control. If `loginExpirationInDays` is set, it takes precedent.
   * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
   * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specified on the server.  See packages/oauth-encryption/README.md for details.
   * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
   * @param {Number} options.passwordResetTokenExpiration The number of milliseconds from when a link to reset password is sent until token expires and user can't reset password with the link anymore. If `passwordResetTokenExpirationInDays` is set, it takes precedent.
   * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set initial password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
   * @param {Number} options.passwordEnrollTokenExpiration The number of milliseconds from when a link to set initial password is sent until token expires and user can't set password with the link anymore. If `passwordEnrollTokenExpirationInDays` is set, it takes precedent.
   * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to `false`, but in production environments it is recommended it defaults to `true`.
   * @param {Number} options.bcryptRounds Allows override of number of bcrypt rounds (aka work factor) used to store passwords. The default is 10.
   * @param {MongoFieldSpecifier} options.defaultFieldSelector To exclude by default large custom fields from `Meteor.user()` and `Meteor.findUserBy...()` functions when called without a field selector, and all `onLogin`, `onLoginFailure` and `onLogout` callbacks.  Example: `Accounts.config({ defaultFieldSelector: { myBigArray: 0 }})`. Beware when using this. If, for instance, you do not include `email` when excluding the fields, you can have problems with functions like `forgotPassword` that will break because they won't have the required data available. It's recommend that you always keep the fields `_id`, `username`, and `email`.
   * @param {String|Mongo.Collection} options.collection A collection name or a Mongo.Collection object to hold the users.
   * @param {Number} options.loginTokenExpirationHours When using the package `accounts-2fa`, use this to set the amount of time a token sent is valid. As it's just a number, you can use, for example, 0.5 to make the token valid for just half hour. The default is 1 hour.
   * @param {Number} options.tokenSequenceLength When using the package `accounts-2fa`, use this to the size of the token sequence generated. The default is 6.
   * @param {'session' | 'local'} options.clientStorage By default login credentials are stored in local storage, setting this to true will switch to using session storage.
   */
  config(options) {
    // We don't want users to accidentally only call Accounts.config on the
    // client, where some of the options will have partial effects (eg removing
    // the "create account" button from accounts-ui if forbidClientAccountCreation
    // is set, or redirecting Google login to a specific-domain page) without
    // having their full effects.
    if (Meteor.isServer) {
      __meteor_runtime_config__.accountsConfigCalled = true;
    } else if (!__meteor_runtime_config__.accountsConfigCalled) {
      // XXX would be nice to "crash" the client and replace the UI with an error
      // message, but there's no trivial way to do this.
      Meteor._debug(
        'Accounts.config was called on the client but not on the ' +
          'server; some configuration options may not take effect.'
      );
    }

    // We need to validate the oauthSecretKey option at the time
    // Accounts.config is called. We also deliberately don't store the
    // oauthSecretKey in Accounts._options.
    if (Object.prototype.hasOwnProperty.call(options, 'oauthSecretKey')) {
      if (Meteor.isClient) {
        throw new Error(
          'The oauthSecretKey option may only be specified on the server'
        );
      }
      if (!Package['oauth-encryption']) {
        throw new Error(
          'The oauth-encryption package must be loaded to set oauthSecretKey'
        );
      }
      Package['oauth-encryption'].OAuthEncryption.loadKey(
        options.oauthSecretKey
      );
      options = { ...options };
      delete options.oauthSecretKey;
    }

    // Validate config options keys
    for (const key of Object.keys(options)) {
      if (!VALID_CONFIG_KEYS.includes(key)) {
        console.error(`Accounts.config: Invalid key: ${key}`);
      }
    }

    // set values in Accounts._options
    for (const key of VALID_CONFIG_KEYS) {
      if (key in options) {
        if (key in this._options) {
          if (key !== 'collection' && (Meteor.isTest && key !== 'clientStorage')) {
            throw new Meteor.Error(`Can't set \`${key}\` more than once`);
          }
        }
        this._options[key] = options[key];
      }
    }

    if (options.collection && options.collection !== this.users._name && options.collection !== this.users) {
      this.users = this._initializeCollection(options);
    }
  }

  /**
   * @summary Register a callback to be called after a login attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when login is successful.
   *                        The callback receives a single object that
   *                        holds login details. This object contains the login
   *                        result type (password, resume, etc.) on both the
   *                        client and server. `onLogin` callbacks registered
   *                        on the server also receive extra data, such
   *                        as user details, connection information, etc.
   */
  onLogin(func) {
    let ret = this._onLoginHook.register(func);
    // call the just registered callback if already logged in
    this._startupCallback(ret.callback);
    return ret;
  }

  /**
   * @summary Register a callback to be called after a login attempt fails.
   * @locus Anywhere
   * @param {Function} func The callback to be called after the login has failed.
   */
  onLoginFailure(func) {
    return this._onLoginFailureHook.register(func);
  }

  /**
   * @summary Register a callback to be called after a logout attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when logout is successful.
   */
  onLogout(func) {
    return this._onLogoutHook.register(func);
  }

  _initConnection(options) {
    if (!Meteor.isClient) {
      return;
    }

    // The connection used by the Accounts system. This is the connection
    // that will get logged in by Meteor.login(), and this is the
    // connection whose login state will be reflected by Meteor.userId().
    //
    // It would be much preferable for this to be in accounts_client.js,
    // but it has to be here because it's needed to create the
    // Meteor.users collection.
    if (options.connection) {
      this.connection = options.connection;
    } else if (options.ddpUrl) {
      this.connection = DDP.connect(options.ddpUrl);
    } else if (
      typeof __meteor_runtime_config__ !== 'undefined' &&
      __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL
    ) {
      // Temporary, internal hook to allow the server to point the client
      // to a different authentication server. This is for a very
      // particular use case that comes up when implementing a oauth
      // server. Unsupported and may go away at any point in time.
      //
      // We will eventually provide a general way to use account-base
      // against any DDP connection, not just one special one.
      this.connection = DDP.connect(
        __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL
      );
    } else {
      this.connection = Meteor.connection;
    }
  }

  _getTokenLifetimeMs() {
    // When loginExpirationInDays is set to null, we'll use a really high
    // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
    // unexpiring token.
    const loginExpirationInDays =
      this._options.loginExpirationInDays === null
        ? LOGIN_UNEXPIRING_TOKEN_DAYS
        : this._options.loginExpirationInDays;
    return (
      this._options.loginExpiration ||
      (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 86400000
    );
  }

  _getPasswordResetTokenLifetimeMs() {
    return (
      this._options.passwordResetTokenExpiration ||
      (this._options.passwordResetTokenExpirationInDays ||
        DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 86400000
    );
  }

  _getPasswordEnrollTokenLifetimeMs() {
    return (
      this._options.passwordEnrollTokenExpiration ||
      (this._options.passwordEnrollTokenExpirationInDays ||
        DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 86400000
    );
  }

  _tokenExpiration(when) {
    // We pass when through the Date constructor for backwards compatibility;
    // `when` used to be a number.
    return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
  }

  _tokenExpiresSoon(when) {
    let minLifetimeMs = 0.1 * this._getTokenLifetimeMs();
    const minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
    if (minLifetimeMs > minLifetimeCapMs) {
      minLifetimeMs = minLifetimeCapMs;
    }
    return new Date() > new Date(when) - minLifetimeMs;
  }

  // No-op on the server, overridden on the client.
  _startupCallback(callback) {}
}

// Note that Accounts is defined separately in accounts_client.js and
// accounts_server.js.

/**
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 */
Meteor.userId = () => Accounts.userId();

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.user = options => Accounts.user(options);

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.userAsync = options => Accounts.userAsync(options);

// how long (in days) until a login token expires
const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
// how long (in days) until reset password token expires
const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3;
// how long (in days) until enrol password token expires
const DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30;
// Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.
// Tries to avoid abrupt disconnects from expiring tokens.
const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
// how often (in milliseconds) we check for expired tokens
export const EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000; // 10 minutes
// A large number of expiration days (approximately 100 years worth) that is
// used when creating unexpiring tokens.
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
