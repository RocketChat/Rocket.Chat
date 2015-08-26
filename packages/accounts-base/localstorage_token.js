var Ap = AccountsClient.prototype;

// This file deals with storing a login token and user id in the
// browser's localStorage facility. It polls local storage every few
// seconds to synchronize login state between multiple tabs in the same
// browser.

// Login with a Meteor access token. This is the only public function
// here.
Meteor.loginWithToken = function (token, callback) {
  return Accounts.loginWithToken(token, callback);
};

Ap.loginWithToken = function (token, callback) {
  this.callLoginMethod({
    methodArguments: [{
      resume: token
    }],
    userCallback: callback
  });
};

// Semi-internal API. Call this function to re-enable auto login after
// if it was disabled at startup.
Ap._enableAutoLogin = function () {
  this._autoLoginEnabled = true;
  this._pollStoredLoginToken();
};


///
/// STORING
///

// Call this from the top level of the test file for any test that does
// logging in and out, to protect multiple tabs running the same tests
// simultaneously from interfering with each others' localStorage.
Ap._isolateLoginTokenForTest = function () {
  this.LOGIN_TOKEN_KEY = this.LOGIN_TOKEN_KEY + Random.id();
  this.USER_ID_KEY = this.USER_ID_KEY + Random.id();
};

Ap._storeLoginToken = function (userId, token, tokenExpires) {
  Meteor._localStorage.setItem(this.USER_ID_KEY, userId);
  Meteor._localStorage.setItem(this.LOGIN_TOKEN_KEY, token);
  if (! tokenExpires)
    tokenExpires = this._tokenExpiration(new Date());
  Meteor._localStorage.setItem(this.LOGIN_TOKEN_EXPIRES_KEY, tokenExpires);

  // to ensure that the localstorage poller doesn't end up trying to
  // connect a second time
  this._lastLoginTokenWhenPolled = token;
};

Ap._unstoreLoginToken = function () {
  Meteor._localStorage.removeItem(this.USER_ID_KEY);
  Meteor._localStorage.removeItem(this.LOGIN_TOKEN_KEY);
  Meteor._localStorage.removeItem(this.LOGIN_TOKEN_EXPIRES_KEY);

  // to ensure that the localstorage poller doesn't end up trying to
  // connect a second time
  this._lastLoginTokenWhenPolled = null;
};

// This is private, but it is exported for now because it is used by a
// test in accounts-password.
//
Ap._storedLoginToken = function () {
  return Meteor._localStorage.getItem(this.LOGIN_TOKEN_KEY);
};

Ap._storedLoginTokenExpires = function () {
  return Meteor._localStorage.getItem(this.LOGIN_TOKEN_EXPIRES_KEY);
};

Ap._storedUserId = function () {
  return Meteor._localStorage.getItem(this.USER_ID_KEY);
};

Ap._unstoreLoginTokenIfExpiresSoon = function () {
  var tokenExpires = this._storedLoginTokenExpires();
  if (tokenExpires && this._tokenExpiresSoon(new Date(tokenExpires))) {
    this._unstoreLoginToken();
  }
};

///
/// AUTO-LOGIN
///

Ap._initLocalStorage = function () {
  var self = this;

  // Key names to use in localStorage
  self.LOGIN_TOKEN_KEY = "Meteor.loginToken";
  self.LOGIN_TOKEN_EXPIRES_KEY = "Meteor.loginTokenExpires";
  self.USER_ID_KEY = "Meteor.userId";

  var rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  if (rootUrlPathPrefix || this.connection !== Meteor.connection) {
    // We want to keep using the same keys for existing apps that do not
    // set a custom ROOT_URL_PATH_PREFIX, so that most users will not have
    // to log in again after an app updates to a version of Meteor that
    // contains this code, but it's generally preferable to namespace the
    // keys so that connections from distinct apps to distinct DDP URLs
    // will be distinct in Meteor._localStorage.
    var namespace = ":" + this.connection._stream.rawUrl;
    if (rootUrlPathPrefix) {
      namespace += ":" + rootUrlPathPrefix;
    }
    self.LOGIN_TOKEN_KEY += namespace;
    self.LOGIN_TOKEN_EXPIRES_KEY += namespace;
    self.USER_ID_KEY += namespace;
  }

  if (self._autoLoginEnabled) {
    // Immediately try to log in via local storage, so that any DDP
    // messages are sent after we have established our user account
    self._unstoreLoginTokenIfExpiresSoon();
    var token = self._storedLoginToken();
    if (token) {
      // On startup, optimistically present us as logged in while the
      // request is in flight. This reduces page flicker on startup.
      var userId = self._storedUserId();
      userId && self.connection.setUserId(userId);
      self.loginWithToken(token, function (err) {
        if (err) {
          Meteor._debug("Error logging in with token: " + err);
          self.makeClientLoggedOut();
        }

        self._pageLoadLogin({
          type: "resume",
          allowed: !err,
          error: err,
          methodName: "login",
          // XXX This is duplicate code with loginWithToken, but
          // loginWithToken can also be called at other times besides
          // page load.
          methodArguments: [{resume: token}]
        });
      });
    }
  }

  // Poll local storage every 3 seconds to login if someone logged in in
  // another tab
  self._lastLoginTokenWhenPolled = token;

  if (self._pollIntervalTimer) {
    // Unlikely that _initLocalStorage will be called more than once for
    // the same AccountsClient instance, but just in case...
    clearInterval(self._pollIntervalTimer);
  }

  self._pollIntervalTimer = setInterval(function () {
    self._pollStoredLoginToken();
  }, 3000);
};

Ap._pollStoredLoginToken = function () {
  var self = this;

  if (! self._autoLoginEnabled) {
    return;
  }

  var currentLoginToken = self._storedLoginToken();

  // != instead of !== just to make sure undefined and null are treated the same
  if (self._lastLoginTokenWhenPolled != currentLoginToken) {
    if (currentLoginToken) {
      self.loginWithToken(currentLoginToken, function (err) {
        if (err) {
          self.makeClientLoggedOut();
        }
      });
    } else {
      self.logout();
    }
  }

  self._lastLoginTokenWhenPolled = currentLoginToken;
};
