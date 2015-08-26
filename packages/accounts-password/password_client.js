// Attempt to log in with a password.
//
// @param selector {String|Object} One of the following:
//   - {username: (username)}
//   - {email: (email)}
//   - a string which may be a username or email, depending on whether
//     it contains "@".
// @param password {String}
// @param callback {Function(error|undefined)}

/**
 * @summary Log the user in with a password.
 * @locus Client
 * @param {Object | String} user
 *   Either a string interpreted as a username or an email; or an object with a
 *   single key: `email`, `username` or `id`. Username or email match in a case
 *   insensitive manner.
 * @param {String} password The user's password.
 * @param {Function} [callback] Optional callback.
 *   Called with no arguments on success, or with a single `Error` argument
 *   on failure.
 */
Meteor.loginWithPassword = function (selector, password, callback) {
  if (typeof selector === 'string')
    if (selector.indexOf('@') === -1)
      selector = {username: selector};
    else
      selector = {email: selector};

  Accounts.callLoginMethod({
    methodArguments: [{
      user: selector,
      password: Accounts._hashPassword(password)
    }],
    userCallback: function (error, result) {
      if (error && error.error === 400 &&
          error.reason === 'old password format') {
        // The "reason" string should match the error thrown in the
        // password login handler in password_server.js.

        // XXX COMPAT WITH 0.8.1.3
        // If this user's last login was with a previous version of
        // Meteor that used SRP, then the server throws this error to
        // indicate that we should try again. The error includes the
        // user's SRP identity. We provide a value derived from the
        // identity and the password to prove to the server that we know
        // the password without requiring a full SRP flow, as well as
        // SHA256(password), which the server bcrypts and stores in
        // place of the old SRP information for this user.
        srpUpgradePath({
          upgradeError: error,
          userSelector: selector,
          plaintextPassword: password
        }, callback);
      }
      else if (error) {
        callback && callback(error);
      } else {
        callback && callback();
      }
    }
  });
};

Accounts._hashPassword = function (password) {
  return {
    digest: SHA256(password),
    algorithm: "sha-256"
  };
};

// XXX COMPAT WITH 0.8.1.3
// The server requested an upgrade from the old SRP password format,
// so supply the needed SRP identity to login. Options:
//   - upgradeError: the error object that the server returned to tell
//     us to upgrade from SRP to bcrypt.
//   - userSelector: selector to retrieve the user object
//   - plaintextPassword: the password as a string
var srpUpgradePath = function (options, callback) {
  var details;
  try {
    details = EJSON.parse(options.upgradeError.details);
  } catch (e) {}
  if (!(details && details.format === 'srp')) {
    callback && callback(
      new Meteor.Error(400, "Password is old. Please reset your " +
                       "password."));
  } else {
    Accounts.callLoginMethod({
      methodArguments: [{
        user: options.userSelector,
        srp: SHA256(details.identity + ":" + options.plaintextPassword),
        password: Accounts._hashPassword(options.plaintextPassword)
      }],
      userCallback: callback
    });
  }
};


// Attempt to log in as a new user.

/**
 * @summary Create a new user.
 * @locus Anywhere
 * @param {Object} options
 * @param {String} options.username A unique name for this user.
 * @param {String} options.email The user's email address.
 * @param {String} options.password The user's password. This is __not__ sent in plain text over the wire.
 * @param {Object} options.profile The user's profile, typically including the `name` field.
 * @param {Function} [callback] Client only, optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 */
Accounts.createUser = function (options, callback) {
  options = _.clone(options); // we'll be modifying options

  if (typeof options.password !== 'string')
    throw new Error("options.password must be a string");
  if (!options.password) {
    callback(new Meteor.Error(400, "Password may not be empty"));
    return;
  }

  // Replace password with the hashed password.
  options.password = Accounts._hashPassword(options.password);

  Accounts.callLoginMethod({
    methodName: 'createUser',
    methodArguments: [options],
    userCallback: callback
  });
};



// Change password. Must be logged in.
//
// @param oldPassword {String|null} By default servers no longer allow
//   changing password without the old password, but they could so we
//   support passing no password to the server and letting it decide.
// @param newPassword {String}
// @param callback {Function(error|undefined)}

/**
 * @summary Change the current user's password. Must be logged in.
 * @locus Client
 * @param {String} oldPassword The user's current password. This is __not__ sent in plain text over the wire.
 * @param {String} newPassword A new password for the user. This is __not__ sent in plain text over the wire.
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 */
Accounts.changePassword = function (oldPassword, newPassword, callback) {
  if (!Meteor.user()) {
    callback && callback(new Error("Must be logged in to change password."));
    return;
  }

  check(newPassword, String);
  if (!newPassword) {
    callback(new Meteor.Error(400, "Password may not be empty"));
    return;
  }

  Accounts.connection.apply(
    'changePassword',
    [oldPassword ? Accounts._hashPassword(oldPassword) : null,
     Accounts._hashPassword(newPassword)],
    function (error, result) {
      if (error || !result) {
        if (error && error.error === 400 &&
            error.reason === 'old password format') {
          // XXX COMPAT WITH 0.8.1.3
          // The server is telling us to upgrade from SRP to bcrypt, as
          // in Meteor.loginWithPassword.
          srpUpgradePath({
            upgradeError: error,
            userSelector: { id: Meteor.userId() },
            plaintextPassword: oldPassword
          }, function (err) {
            if (err) {
              callback && callback(err);
            } else {
              // Now that we've successfully migrated from srp to
              // bcrypt, try changing the password again.
              Accounts.changePassword(oldPassword, newPassword, callback);
            }
          });
        } else {
          // A normal error, not an error telling us to upgrade to bcrypt
          callback && callback(
            error || new Error("No result from changePassword."));
        }
      } else {
        callback && callback();
      }
    }
  );
};

// Sends an email to a user with a link that can be used to reset
// their password
//
// @param options {Object}
//   - email: (email)
// @param callback (optional) {Function(error|undefined)}

/**
 * @summary Request a forgot password email.
 * @locus Client
 * @param {Object} options
 * @param {String} options.email The email address to send a password reset link.
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 */
Accounts.forgotPassword = function(options, callback) {
  if (!options.email)
    throw new Error("Must pass options.email");
  Accounts.connection.call("forgotPassword", options, callback);
};

// Resets a password based on a token originally created by
// Accounts.forgotPassword, and then logs in the matching user.
//
// @param token {String}
// @param newPassword {String}
// @param callback (optional) {Function(error|undefined)}

/**
 * @summary Reset the password for a user using a token received in email. Logs the user in afterwards.
 * @locus Client
 * @param {String} token The token retrieved from the reset password URL.
 * @param {String} newPassword A new password for the user. This is __not__ sent in plain text over the wire.
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 */
Accounts.resetPassword = function(token, newPassword, callback) {
  check(token, String);
  check(newPassword, String);

  if (!newPassword) {
    callback(new Meteor.Error(400, "Password may not be empty"));
    return;
  }

  Accounts.callLoginMethod({
    methodName: 'resetPassword',
    methodArguments: [token, Accounts._hashPassword(newPassword)],
    userCallback: callback});
};

// Verifies a user's email address based on a token originally
// created by Accounts.sendVerificationEmail
//
// @param token {String}
// @param callback (optional) {Function(error|undefined)}

/**
 * @summary Marks the user's email address as verified. Logs the user in afterwards.
 * @locus Client
 * @param {String} token The token retrieved from the verification URL.
 * @param {Function} [callback] Optional callback. Called with no arguments on success, or with a single `Error` argument on failure.
 */
Accounts.verifyEmail = function(token, callback) {
  if (!token)
    throw new Error("Need to pass token");

  Accounts.callLoginMethod({
    methodName: 'verifyEmail',
    methodArguments: [token],
    userCallback: callback});
};
