var Ap = AccountsClient.prototype;

// All of the special hash URLs we support for accounts interactions
var accountsPaths = ["reset-password", "verify-email", "enroll-account"];

var savedHash = window.location.hash;

Ap._initUrlMatching = function () {
  // By default, allow the autologin process to happen.
  this._autoLoginEnabled = true;

  // We only support one callback per URL.
  this._accountsCallbacks = {};

  // Try to match the saved value of window.location.hash.
  this._attemptToMatchHash();
};

// Separate out this functionality for testing

Ap._attemptToMatchHash = function () {
  attemptToMatchHash(this, savedHash, defaultSuccessHandler);
};

// Note that both arguments are optional and are currently only passed by
// accounts_url_tests.js.
function attemptToMatchHash(accounts, hash, success) {
  _.each(accountsPaths, function (urlPart) {
    var token;

    var tokenRegex = new RegExp("^\\#\\/" + urlPart + "\\/(.*)$");
    var match = hash.match(tokenRegex);

    if (match) {
      token = match[1];

      // XXX COMPAT WITH 0.9.3
      if (urlPart === "reset-password") {
        accounts._resetPasswordToken = token;
      } else if (urlPart === "verify-email") {
        accounts._verifyEmailToken = token;
      } else if (urlPart === "enroll-account") {
        accounts._enrollAccountToken = token;
      }
    } else {
      return;
    }

    // If no handlers match the hash, then maybe it's meant to be consumed
    // by some entirely different code, so we only clear it the first time
    // a handler successfully matches. Note that later handlers reuse the
    // savedHash, so clearing window.location.hash here will not interfere
    // with their needs.
    window.location.hash = "";

    // Do some stuff with the token we matched
    success.call(accounts, token, urlPart);
  });
}

function defaultSuccessHandler(token, urlPart) {
  var self = this;

  // put login in a suspended state to wait for the interaction to finish
  self._autoLoginEnabled = false;

  // wait for other packages to register callbacks
  Meteor.startup(function () {
    // if a callback has been registered for this kind of token, call it
    if (self._accountsCallbacks[urlPart]) {
      self._accountsCallbacks[urlPart](token, function () {
        self._enableAutoLogin();
      });
    }
  });
}

// Export for testing
AccountsTest = {
  attemptToMatchHash: function (hash, success) {
    return attemptToMatchHash(Accounts, hash, success);
  }
};

// XXX these should be moved to accounts-password eventually. Right now
// this is prevented by the need to set autoLoginEnabled=false, but in
// some bright future we won't need to do that anymore.

/**
 * @summary Register a function to call when a reset password link is clicked
 * in an email sent by
 * [`Accounts.sendResetPasswordEmail`](#accounts_sendresetpasswordemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: A password reset token that can be passed to
 * [`Accounts.resetPassword`](#accounts_resetpassword).
 * 2. `done`: A function to call when the password reset UI flow is complete. The normal
 * login process is suspended until this function is called, so that the
 * password for user A can be reset even if user B was logged in.
 * @locus Client
 */
Ap.onResetPasswordLink = function (callback) {
  if (this._accountsCallbacks["reset-password"]) {
    Meteor._debug("Accounts.onResetPasswordLink was called more than once. " +
      "Only one callback added will be executed.");
  }

  this._accountsCallbacks["reset-password"] = callback;
};

/**
 * @summary Register a function to call when an email verification link is
 * clicked in an email sent by
 * [`Accounts.sendVerificationEmail`](#accounts_sendverificationemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: An email verification token that can be passed to
 * [`Accounts.verifyEmail`](#accounts_verifyemail).
 * 2. `done`: A function to call when the email verification UI flow is complete.
 * The normal login process is suspended until this function is called, so
 * that the user can be notified that they are verifying their email before
 * being logged in.
 * @locus Client
 */
Ap.onEmailVerificationLink = function (callback) {
  if (this._accountsCallbacks["verify-email"]) {
    Meteor._debug("Accounts.onEmailVerificationLink was called more than once. " +
      "Only one callback added will be executed.");
  }

  this._accountsCallbacks["verify-email"] = callback;
};

/**
 * @summary Register a function to call when an account enrollment link is
 * clicked in an email sent by
 * [`Accounts.sendEnrollmentEmail`](#accounts_sendenrollmentemail).
 * This function should be called in top-level code, not inside
 * `Meteor.startup()`.
 * @param  {Function} callback The function to call. It is given two arguments:
 *
 * 1. `token`: A password reset token that can be passed to
 * [`Accounts.resetPassword`](#accounts_resetpassword) to give the newly
 * enrolled account a password.
 * 2. `done`: A function to call when the enrollment UI flow is complete.
 * The normal login process is suspended until this function is called, so that
 * user A can be enrolled even if user B was logged in.
 * @locus Client
 */
Ap.onEnrollmentLink = function (callback) {
  if (this._accountsCallbacks["enroll-account"]) {
    Meteor._debug("Accounts.onEnrollmentLink was called more than once. " +
      "Only one callback added will be executed.");
  }

  this._accountsCallbacks["enroll-account"] = callback;
};
