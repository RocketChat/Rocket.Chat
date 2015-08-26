Accounts._noConnectionCloseDelayForTest = true;
Accounts.removeDefaultRateLimit();
if (Meteor.isServer) {
  Meteor.methods({
    getUserId: function () {
      return this.userId;
    },
    getResetToken: function () {
      var token = Meteor.users.findOne(this.userId).services.password.reset;
      return token;
    },
    addSkipCaseInsensitiveChecksForTest: function (value) {
      Accounts._skipCaseInsensitiveChecksForTest[value] = true;
    },
    removeSkipCaseInsensitiveChecksForTest: function (value) {
      delete Accounts._skipCaseInsensitiveChecksForTest[value];
    },
    countUsersOnServer: function (query) {
      return Meteor.users.find(query).count();
    }
  });
}

if (Meteor.isClient) (function () {

  // XXX note, only one test can do login/logout things at once! for
  // now, that is this test.

  Accounts._isolateLoginTokenForTest();

  var addSkipCaseInsensitiveChecksForTest = function (value, test, expect) {
    Meteor.call('addSkipCaseInsensitiveChecksForTest', value, expect);
  };

  var removeSkipCaseInsensitiveChecksForTest = function (value, test, expect) {
    Meteor.call('removeSkipCaseInsensitiveChecksForTest', value, expect);
  };

  var createUserStep = function (test, expect) {
    // Hack because Tinytest does not clean the database between tests/runs
    this.randomSuffix = Random.id(10);
    this.username = 'AdaLovelace' + this.randomSuffix;
    this.email =  "Ada-intercept@lovelace.com" + this.randomSuffix;
    this.password = 'password';
    Accounts.createUser(
      {username: this.username, email: this.email, password: this.password},
      loggedInAs(this.username, test, expect));
  };
  var logoutStep = function (test, expect) {
    Meteor.logout(expect(function (error) {
      test.equal(error, undefined);
      test.equal(Meteor.user(), null);
    }));
  };
  var loggedInAs = function (someUsername, test, expect) {
    return expect(function (error) {
      console.log("Meteor.user is", Meteor.users.find().fetch(), Meteor.user());
      test.equal(error, undefined);
      test.equal(Meteor.user().username, someUsername);
    });
  };
  var expectError = function (expectedError, test, expect) {
    return expect(function (actualError) {
      test.equal(actualError && actualError.error, expectedError.error);
      test.equal(actualError && actualError.reason, expectedError.reason);
    });
  };
  var expectUserNotFound = function (test, expect) {
    return expectError(new Meteor.Error(403, "User not found"), test, expect);
  };
  var waitForLoggedOutStep = function (test, expect) {
    pollUntil(expect, function () {
      return Meteor.userId() === null;
    }, 10 * 1000, 100);
  };
  var invalidateLoginsStep = function (test, expect) {
    Meteor.call("testInvalidateLogins", 'fail', expect(function (error) {
      test.isFalse(error);
    }));
  };
  var hideActualLoginErrorStep = function (test, expect) {
    Meteor.call("testInvalidateLogins", 'hide', expect(function (error) {
      test.isFalse(error);
    }));
  };
  var validateLoginsStep = function (test, expect) {
    Meteor.call("testInvalidateLogins", false, expect(function (error) {
      test.isFalse(error);
    }));
  };

  testAsyncMulti("passwords - basic login with password", [
    function (test, expect) {
      // setup
      this.username = Random.id();
      this.email = Random.id() + '-intercept@example.com';
      this.password = 'password';

      Accounts.createUser(
        {username: this.username, email: this.email, password: this.password},
        loggedInAs(this.username, test, expect));
    },
    function (test, expect) {
      test.notEqual(Meteor.userId(), null);
    },
    logoutStep,
    function (test, expect) {
      Meteor.loginWithPassword(this.username, this.password,
                               loggedInAs(this.username, test, expect));
    },
    logoutStep,
    // This next step tests reactive contexts which are reactive on
    // Meteor.user().
    function (test, expect) {
      // Set up a reactive context that only refreshes when Meteor.user() is
      // invalidated.
      var loaded = false;
      var handle = Tracker.autorun(function () {
        if (Meteor.user() && Meteor.user().emails)
          loaded = true;
      });
      // At the beginning, we're not logged in.
      test.isFalse(loaded);
      Meteor.loginWithPassword(this.username, this.password, expect(function (error) {
        test.equal(error, undefined);
        test.notEqual(Meteor.userId(), null);
        // By the time of the login callback, the user should be loaded.
        test.isTrue(Meteor.user().emails);
        // Flushing should get us the rerun as well.
        Tracker.flush();
        test.isTrue(loaded);
        handle.stop();
      }));
    },
    logoutStep,
    function (test, expect) {
      Meteor.loginWithPassword({username: this.username}, this.password,
                               loggedInAs(this.username, test, expect));
    },
    logoutStep,
    function (test, expect) {
      Meteor.loginWithPassword(this.email, this.password,
                               loggedInAs(this.username, test, expect));
    },
    logoutStep,
    function (test, expect) {
      Meteor.loginWithPassword({email: this.email}, this.password,
                               loggedInAs(this.username, test, expect));
    },
    logoutStep
  ]);


  // testAsyncMulti("passwords - plain text passwords", [
  //   function (test, expect) {
  //     // setup
  //     this.username = Random.id();
  //     this.email = Random.id() + '-intercept@example.com';
  //     this.password = 'password';

  //     // create user with raw password (no API, need to invoke callLoginMethod
  //     // directly)
  //     Accounts.callLoginMethod({
  //       methodName: 'createUser',
  //       methodArguments: [{username: this.username, password: this.password}],
  //       userCallback: loggedInAs(this.username, test, expect)
  //     });
  //   },
  //   logoutStep,
  //   // check can login normally with this password.
  //   function(test, expect) {
  //     Meteor.loginWithPassword({username: this.username}, this.password,
  //                              loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep,
  //   // plain text password. no API for this, have to invoke callLoginMethod
  //   // directly.
  //   function (test, expect) {
  //     Accounts.callLoginMethod({
  //       // wrong password
  //       methodArguments: [{user: {username: this.username}, password: 'wrong'}],
  //       userCallback: expect(function (error) {
  //         test.isTrue(error);
  //         test.isFalse(Meteor.user());
  //       })});
  //   },
  //   function (test, expect) {
  //     Accounts.callLoginMethod({
  //       // right password
  //       methodArguments: [{user: {username: this.username},
  //                          password: this.password}],
  //       userCallback: loggedInAs(this.username, test, expect)
  //     });
  //   },
  //   logoutStep
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive username", [
  //   createUserStep,
  //   logoutStep,
  //   // We should be able to log in with the username in lower case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: "adalovelace" + this.randomSuffix },
  //       this.password,
  //       loggedInAs(this.username, test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive username with non-ASCII characters", [
  //   function (test, expect) {
  //     // Hack because Tinytest does not clean the database between tests/runs
  //     this.randomSuffix = Random.id(10);
  //     this.username = 'ÁdaLØvela😈e' + this.randomSuffix;
  //     this.password = 'password';
  //     Accounts.createUser(
  //       {username: this.username, email: this.email, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep,
  //   // We should be able to log in with the username in lower case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: "ádaløvela😈e" + this.randomSuffix },
  //       this.password,
  //       loggedInAs(this.username, test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive username should escape regex special characters", [
  //   createUserStep,
  //   logoutStep,
  //   // We shouldn't be able to log in with a regex expression for the username
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: ".+" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive username should require a match of the full string", [
  //   createUserStep,
  //   logoutStep,
  //   // We shouldn't be able to log in with a partial match for the username
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: "lovelace" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive username when there are multiple matches", [
  //   createUserStep,
  //   logoutStep,
  //   function (test, expect) {
  //     this.otherUserName = 'Adalovelace' + this.randomSuffix;
  //     addSkipCaseInsensitiveChecksForTest(this.otherUserName, test, expect);
  //   },
  //   // Create another user with a username that only differs in case
  //   function (test, expect) {
  //     Accounts.createUser(
  //       { username: this.otherUserName, password: this.password },
  //       loggedInAs(this.otherUserName, test, expect));
  //   },
  //   function (test, expect) {
  //     removeSkipCaseInsensitiveChecksForTest(this.otherUserName, test, expect);
  //   },
  //   // We shouldn't be able to log in with the username in lower case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: "adalovelace" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   },
  //   // We should still be able to log in with the username in original case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { username: this.username },
  //       this.password,
  //       loggedInAs(this.username, test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - creating users with the same case insensitive username", [
  //   createUserStep,
  //   logoutStep,
  //   // Attempting to create another user with a username that only differs in
  //   // case should fail
  //   function (test, expect) {
  //     this.newUsername = 'adalovelace' + this.randomSuffix;
  //     Accounts.createUser(
  //       { username: this.newUsername, password: this.password },
  //       expectError(
  //         new Meteor.Error(403, "Username already exists."),
  //         test,
  //         expect));
  //   },
  //   // Make sure the new user has not been inserted
  //   function (test, expect) {
  //     Meteor.call('countUsersOnServer',
  //       { username: this.newUsername },
  //       expect(function (error, result) {
  //         test.equal(result, 0);
  //     }));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive email", [
  //   createUserStep,
  //   logoutStep,
  //   // We should be able to log in with the email in lower case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { email: "ada-intercept@lovelace.com" + this.randomSuffix },
  //       this.password,
  //       loggedInAs(this.username, test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive email should escape regex special characters", [
  //   createUserStep,
  //   logoutStep,
  //   // We shouldn't be able to log in with a regex expression for the email
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { email: ".+" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive email should require a match of the full string", [
  //   createUserStep,
  //   logoutStep,
  //   // We shouldn't be able to log in with a partial match for the email
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { email: "com" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - logging in with case insensitive email when there are multiple matches", [
  //   createUserStep,
  //   logoutStep,
  //   function (test, expect) {
  //     this.otherUserName = 'AdaLovelace' + Random.id(10);
  //     this.otherEmail =  "ADA-intercept@lovelace.com" + this.randomSuffix;
  //     addSkipCaseInsensitiveChecksForTest(this.otherEmail, test, expect);
  //   },
  //   // Create another user with an email that only differs in case
  //   function (test, expect) {
  //     Accounts.createUser(
  //       { username: this.otherUserName,
  //         email: this.otherEmail,
  //         password: this.password },
  //       loggedInAs(this.otherUserName, test, expect));
  //   },
  //   function (test, expect) {
  //     removeSkipCaseInsensitiveChecksForTest(this.otherUserName, test, expect);
  //   },
  //   logoutStep,
  //   // We shouldn't be able to log in with the email in lower case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { email: "ada-intercept@lovelace.com" + this.randomSuffix },
  //       this.password,
  //       expectUserNotFound(test, expect));
  //   },
  //   // We should still be able to log in with the email in original case
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       { email: this.email },
  //       this.password,
  //       loggedInAs(this.username, test, expect));
  //   }
  // ]);

  // testAsyncMulti("passwords - creating users with the same case insensitive email", [
  //   createUserStep,
  //   logoutStep,
  //   // Attempting to create another user with an email that only differs in
  //   // case should fail
  //   function (test, expect) {
  //     this.newEmail =  "ada-intercept@lovelace.com" + this.randomSuffix;
  //     Accounts.createUser(
  //       { email: this.newEmail, password: this.password },
  //       expectError(
  //         new Meteor.Error(403, "Email already exists."),
  //         test,
  //         expect));
  //   },
  //   // Make sure the new user has not been inserted
  //   function (test, expect) {
  //     Meteor.call('countUsersOnServer',
  //       { 'emails.address': this.newEmail },
  //       expect (function (error, result) {
  //         test.equal(result, 0);
  //       })
  //     );
  //   }
  // ]);

  // testAsyncMulti("passwords - changing passwords", [
  //   function (test, expect) {
  //     // setup
  //     this.username = Random.id();
  //     this.email = Random.id() + '-intercept@example.com';
  //     this.password = 'password';
  //     this.password2 = 'password2';

  //     Accounts.createUser(
  //       { username: this.username, email: this.email, password: this.password },
  //       loggedInAs(this.username, test, expect));
  //   },
  //   // Send a password reset email so that we can test that password
  //   // reset tokens get deleted on password change.
  //   function (test, expect) {
  //     Meteor.call("forgotPassword",
  //       { email: this.email }, expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     var self = this;
  //     Meteor.call("getResetToken", expect(function (err, token) {
  //       test.isFalse(err);
  //       test.isTrue(token);
  //       self.token = token;
  //     }));
  //   },
  //   // change password with bad old password. we stay logged in.
  //   function (test, expect) {
  //     var self = this;
  //     Accounts.changePassword('wrong', 'doesntmatter', expect(function (error) {
  //       test.isTrue(error);
  //       test.equal(Meteor.user().username, self.username);
  //     }));
  //   },
  //   // change password with good old password.
  //   function (test, expect) {
  //     Accounts.changePassword(this.password, this.password2,
  //                             loggedInAs(this.username, test, expect));
  //   },
  //   function (test, expect) {
  //     Meteor.call("getResetToken", expect(function (err, token) {
  //       test.isFalse(err);
  //       test.isFalse(token);
  //     }));
  //   },
  //   logoutStep,
  //   // old password, failed login
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.email, this.password, expect(function (error) {
  //       test.isTrue(error);
  //       test.isFalse(Meteor.user());
  //     }));
  //   },
  //   // new password, success
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.email, this.password2,
  //                              loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep
  // ]);

  // testAsyncMulti("passwords - changing password logs out other clients", [
  //   function (test, expect) {
  //     this.username = Random.id();
  //     this.email = Random.id() + '-intercept@example.com';
  //     this.password = 'password';
  //     this.password2 = 'password2';
  //     Accounts.createUser(
  //       { username: this.username, email: this.email, password: this.password },
  //       loggedInAs(this.username, test, expect));
  //   },
  //   // Log in a second connection as this user.
  //   function (test, expect) {
  //     var self = this;

  //     self.secondConn = DDP.connect(Meteor.absoluteUrl());
  //     self.secondConn.call('login',
  //               { user: { username: self.username }, password: self.password },
  //               expect(function (err, result) {
  //                 test.isFalse(err);
  //                 self.secondConn.setUserId(result.id);
  //                 test.isTrue(self.secondConn.userId());

  //                 self.secondConn.onReconnect = function () {
  //                   self.secondConn.apply(
  //                     'login',
  //                     [{ resume: result.token }],
  //                     { wait: true },
  //                     function (err, result) {
  //                       self.secondConn.setUserId(result && result.id || null);
  //                     }
  //                   );
  //                 };
  //               }));
  //   },
  //   function (test, expect) {
  //     var self = this;
  //     Accounts.changePassword(self.password, self.password2, expect(function (err) {
  //       test.isFalse(err);
  //     }));
  //   },
  //   // Now that we've changed the password, wait until the second
  //   // connection gets logged out.
  //   function (test, expect) {
  //     var self = this;
  //     pollUntil(expect, function () {
  //       return self.secondConn.userId() === null;
  //     }, 10 * 1000, 100);
  //   }
  // ]);


  // testAsyncMulti("passwords - new user hooks", [
  //   function (test, expect) {
  //     // setup
  //     this.username = Random.id();
  //     this.email = Random.id() + '-intercept@example.com';
  //     this.password = 'password';
  //   },
  //   // test Accounts.validateNewUser
  //   function(test, expect) {
  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       expect(function (error) {
  //         test.equal(error.error, 403);
  //         test.equal(error.reason, "User validation failed");
  //       }));
  //   },
  //   logoutStep,
  //   function(test, expect) {
  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       expect(function (error) {
  //         test.equal(
  //           error.reason,
  //           "An exception thrown within Accounts.validateNewUser");
  //       }));
  //   },
  //   // test Accounts.onCreateUser
  //   function(test, expect) {
  //     Accounts.createUser(
  //       {username: this.username, password: this.password,
  //        testOnCreateUserHook: true},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   function(test, expect) {
  //     test.equal(Meteor.user().profile.touchedByOnCreateUser, true);
  //   },
  //   logoutStep
  // ]);


  // testAsyncMulti("passwords - Meteor.user()", [
  //   function (test, expect) {
  //     // setup
  //     this.username = Random.id();
  //     this.password = 'password';

  //     Accounts.createUser(
  //       {username: this.username, password: this.password,
  //        testOnCreateUserHook: true},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   // test Meteor.user(). This test properly belongs in
  //   // accounts-base/accounts_tests.js, but this is where the tests that
  //   // actually log in are.
  //   function(test, expect) {
  //     var self = this;
  //     var clientUser = Meteor.user();
  //     Accounts.connection.call('testMeteorUser', expect(function (err, result) {
  //       test.equal(result._id, clientUser._id);
  //       test.equal(result.username, clientUser.username);
  //       test.equal(result.username, self.username);
  //       test.equal(result.profile.touchedByOnCreateUser, true);
  //       test.equal(err, undefined);
  //     }));
  //   },
  //   function(test, expect) {
  //     // Test that even with no published fields, we still have a document.
  //     Accounts.connection.call('clearUsernameAndProfile', expect(function() {
  //       test.isTrue(Meteor.userId());
  //       var user = Meteor.user();
  //       test.equal(user, {_id: Meteor.userId()});
  //     }));
  //   },
  //   logoutStep,
  //   function(test, expect) {
  //     var clientUser = Meteor.user();
  //     test.equal(clientUser, null);
  //     test.equal(Meteor.userId(), null);
  //     Accounts.connection.call('testMeteorUser', expect(function (err, result) {
  //       test.equal(err, undefined);
  //       test.equal(result, null);
  //     }));
  //   }
  // ]);

  // testAsyncMulti("passwords - tokens", [
  //   function (test, expect) {
  //     // setup
  //     this.username = Random.id();
  //     this.password = 'password';

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },

  //   function (test, expect) {
  //     // we can't login with an invalid token
  //     var expectLoginError = expect(function (err) {
  //       test.isTrue(err);
  //     });
  //     Meteor.loginWithToken('invalid', expectLoginError);
  //   },

  //   function (test, expect) {
  //     // we can login with a valid token
  //     var expectLoginOK = expect(function (err) {
  //       test.isFalse(err);
  //     });
  //     Meteor.loginWithToken(Accounts._storedLoginToken(), expectLoginOK);
  //   },

  //   function (test, expect) {
  //     // test logging out invalidates our token
  //     var expectLoginError = expect(function (err) {
  //       test.isTrue(err);
  //     });
  //     var token = Accounts._storedLoginToken();
  //     test.isTrue(token);
  //     Meteor.logout(function () {
  //       Meteor.loginWithToken(token, expectLoginError);
  //     });
  //   },

  //   function (test, expect) {
  //     var self = this;
  //     // Test that login tokens get expired. We should get logged out when a
  //     // token expires, and not be able to log in again with the same token.
  //     var expectNoError = expect(function (err) {
  //       test.isFalse(err);
  //     });

  //     Meteor.loginWithPassword(this.username, this.password, function (error) {
  //       self.token = Accounts._storedLoginToken();
  //       test.isTrue(self.token);
  //       expectNoError(error);
  //       Accounts.connection.call("expireTokens");
  //     });
  //   },
  //   waitForLoggedOutStep,
  //   function (test, expect) {
  //     var token = Accounts._storedLoginToken();
  //     test.isFalse(token);
  //   },
  //   function (test, expect) {
  //     // Test that once expireTokens is finished, we can't login again with our
  //     // previous token.
  //     Meteor.loginWithToken(this.token, expect(function (err, result) {
  //       test.isTrue(err);
  //       test.equal(Meteor.userId(), null);
  //     }));
  //   },
  //   logoutStep,
  //   function (test, expect) {
  //     var self = this;
  //     // Test that Meteor.logoutOtherClients logs out a second
  //     // authentcated connection while leaving Accounts.connection
  //     // logged in.
  //     var secondConn = DDP.connect(Meteor.absoluteUrl());
  //     var token;

  //     var expectSecondConnLoggedOut = expect(function (err, result) {
  //       test.isTrue(err);
  //     });

  //     var expectAccountsConnLoggedIn = expect(function (err, result) {
  //       test.isFalse(err);
  //     });

  //     var expectSecondConnLoggedIn = expect(function (err, result) {
  //       test.equal(result.token, token);
  //       test.isFalse(err);
  //       Meteor.logoutOtherClients(function (err) {
  //         test.isFalse(err);
  //         secondConn.call('login', { resume: token },
  //                         expectSecondConnLoggedOut);
  //         Accounts.connection.call('login', {
  //           resume: Accounts._storedLoginToken()
  //         }, expectAccountsConnLoggedIn);
  //       });
  //     });

  //     Meteor.loginWithPassword(
  //       self.username,
  //       self.password,
  //       expect(function (err) {
  //         test.isFalse(err);
  //         token = Accounts._storedLoginToken();
  //         test.isTrue(token);
  //         secondConn.call('login', { resume: token },
  //                         expectSecondConnLoggedIn);
  //       })
  //     );
  //   },
  //   logoutStep,

  //   // The tests below this point are for the deprecated
  //   // `logoutOtherClients` method.

  //   function (test, expect) {
  //     var self = this;

  //     // Test that Meteor.logoutOtherClients logs out a second authenticated
  //     // connection while leaving Accounts.connection logged in.
  //     var token;
  //     self.secondConn = DDP.connect(Meteor.absoluteUrl());

  //     var expectLoginError = expect(function (err) {
  //       test.isTrue(err);
  //     });
  //     var expectValidToken = expect(function (err, result) {
  //       test.isFalse(err);
  //       test.isTrue(result);
  //       self.tokenFromLogoutOthers = result.token;
  //     });
  //     var expectSecondConnLoggedIn = expect(function (err, result) {
  //       test.equal(result.token, token);
  //       test.isFalse(err);
  //       // This test will fail if an unrelated reconnect triggers before the
  //       // connection is logged out. In general our tests aren't resilient to
  //       // mid-test reconnects.
  //       self.secondConn.onReconnect = function () {
  //         self.secondConn.call("login", { resume: token }, expectLoginError);
  //       };
  //       Accounts.connection.call("logoutOtherClients", expectValidToken);
  //     });

  //     Meteor.loginWithPassword(this.username, this.password, expect(function (err) {
  //       test.isFalse(err);
  //       token = Accounts._storedLoginToken();
  //       self.beforeLogoutOthersToken = token;
  //       test.isTrue(token);
  //       self.secondConn.call("login", { resume: token },
  //                            expectSecondConnLoggedIn);
  //     }));
  //   },
  //   // Test that logoutOtherClients logged out Accounts.connection and that the
  //   // previous token is no longer valid.
  //   waitForLoggedOutStep,
  //   function (test, expect) {
  //     var self = this;
  //     var token = Accounts._storedLoginToken();
  //     test.isFalse(token);
  //     this.secondConn.close();
  //     Meteor.loginWithToken(
  //       self.beforeLogoutOthersToken,
  //       expect(function (err) {
  //         test.isTrue(err);
  //         test.isFalse(Meteor.userId());
  //       })
  //     );
  //   },
  //   // Test that logoutOtherClients returned a new token that we can use to
  //   // log in.
  //   function (test, expect) {
  //     var self = this;
  //     Meteor.loginWithToken(
  //       self.tokenFromLogoutOthers,
  //       expect(function (err) {
  //         test.isFalse(err);
  //         test.isTrue(Meteor.userId());
  //       })
  //     );
  //   },
  //   logoutStep,



  //   function (test, expect) {
  //     var self = this;
  //     // Test that deleting a user logs out that user's connections.
  //     Meteor.loginWithPassword(this.username, this.password, expect(function (err) {
  //       test.isFalse(err);
  //       Accounts.connection.call("removeUser", self.username);
  //     }));
  //   },
  //   waitForLoggedOutStep
  // ]);

  // testAsyncMulti("passwords - validateLoginAttempt", [
  //   function (test, expect) {
  //     this.username = Random.id();
  //     this.password = "password";

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep,
  //   invalidateLoginsStep,
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       this.username,
  //       this.password,
  //       expect(function (error) {
  //         test.isTrue(error);
  //         test.equal(error.reason, "Login forbidden");
  //       })
  //     );
  //   },
  //   validateLoginsStep,
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       "no such user",
  //       "some password",
  //       expect(function (error) {
  //         test.isTrue(error);
  //         test.equal(error.reason, 'User not found');
  //       })
  //     );
  //   },
  //   hideActualLoginErrorStep,
  //   function (test, expect) {
  //     Meteor.loginWithPassword(
  //       "no such user",
  //       "some password",
  //       expect(function (error) {
  //         test.isTrue(error);
  //         test.equal(error.reason, 'hide actual error');
  //       })
  //     );
  //   },
  //   validateLoginsStep
  // ]);

  // testAsyncMulti("passwords - server onLogin hook", [
  //   function (test, expect) {
  //     Meteor.call("testCaptureLogins", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     this.username = Random.id();
  //     this.password = "password";

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   function (test, expect) {
  //     var self = this;
  //     Meteor.call("testFetchCapturedLogins", expect(function (error, logins) {
  //       test.isFalse(error);
  //       test.equal(logins.length, 1);
  //       var login = logins[0];
  //       test.isTrue(login.successful);
  //       var attempt = login.attempt;
  //       test.equal(attempt.type, "password");
  //       test.isTrue(attempt.allowed);
  //       test.equal(attempt.methodArguments[0].username, self.username);
  //     }));
  //   }
  // ]);

  // testAsyncMulti("passwords - client onLogin hook", [
  //   function (test, expect) {
  //     var self = this;
  //     this.username = Random.id();
  //     this.password = "password";
  //     this.attempt = false;

  //     this.onLogin = Accounts.onLogin(function (attempt) {
  //       self.attempt = true;
  //     });

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   function (test, expect) {
  //     this.onLogin.stop();
  //     test.isTrue(this.attempt);
  //     expect(function () {})();
  //   }
  // ]);

  // testAsyncMulti("passwords - server onLoginFailure hook", [
  //   function (test, expect) {
  //     this.username = Random.id();
  //     this.password = "password";

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep,
  //   function (test, expect) {
  //     Meteor.call("testCaptureLogins", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.username, "incorrect", expect(function (error) {
  //       test.isTrue(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.call("testFetchCapturedLogins", expect(function (error, logins) {
  //       test.isFalse(error);
  //       test.equal(logins.length, 1);
  //       var login = logins[0];
  //       test.isFalse(login.successful);
  //       var attempt = login.attempt;
  //       test.equal(attempt.type, "password");
  //       test.isFalse(attempt.allowed);
  //       test.equal(attempt.error.reason, "Incorrect password");
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.call("testCaptureLogins", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.loginWithPassword("no such user", "incorrect", expect(function (error) {
  //       test.isTrue(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.call("testFetchCapturedLogins", expect(function (error, logins) {
  //       test.isFalse(error);
  //       test.equal(logins.length, 1);
  //       var login = logins[0];
  //       test.isFalse(login.successful);
  //       var attempt = login.attempt;
  //       test.equal(attempt.type, "password");
  //       test.isFalse(attempt.allowed);
  //       test.equal(attempt.error.reason, "User not found");
  //     }));
  //   }
  // ]);

  // testAsyncMulti("passwords - client onLoginFailure hook", [
  //   function (test, expect) {
  //     var self = this;
  //     this.username = Random.id();
  //     this.password = "password";
  //     this.attempt = false;

  //     this.onLoginFailure = Accounts.onLoginFailure(function () {
  //       self.attempt = true;
  //     })

  //     Accounts.createUser(
  //       {username: this.username, password: this.password},
  //       loggedInAs(this.username, test, expect));
  //   },
  //   logoutStep,
  //   function (test, expect) {
  //     Meteor.call("testCaptureLogins", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.username, "incorrect", expect(function (error) {
  //       test.isTrue(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     this.onLoginFailure.stop();
  //     test.isTrue(this.attempt);
  //     expect(function () {})();
  //   }
  // ]);

  // testAsyncMulti("passwords - srp to bcrypt upgrade", [
  //   logoutStep,
  //   // Create user with old SRP credentials in the database.
  //   function (test, expect) {
  //     var self = this;
  //     Meteor.call("testCreateSRPUser", expect(function (error, result) {
  //       test.isFalse(error);
  //       self.username = result;
  //     }));
  //   },
  //   // We are able to login with the old style credentials in the database.
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.username, 'abcdef', expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.call("testSRPUpgrade", this.username, expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   logoutStep,
  //   // After the upgrade to bcrypt we're still able to login.
  //   function (test, expect) {
  //     Meteor.loginWithPassword(this.username, 'abcdef', expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   logoutStep,
  //   function (test, expect) {
  //     Meteor.call("removeUser", this.username, expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   }
  // ]);

  // testAsyncMulti("passwords - srp to bcrypt upgrade via password change", [
  //   logoutStep,
  //   // Create user with old SRP credentials in the database.
  //   function (test, expect) {
  //     var self = this;
  //     Meteor.call("testCreateSRPUser", expect(function (error, result) {
  //       test.isFalse(error);
  //       self.username = result;
  //     }));
  //   },
  //   // Log in with the plaintext password handler, which should NOT upgrade us to bcrypt.
  //   function (test, expect) {
  //     Accounts.callLoginMethod({
  //       methodName: "login",
  //       methodArguments: [ { user: { username: this.username }, password: "abcdef" } ],
  //       userCallback: expect(function (err) {
  //         test.isFalse(err);
  //       })
  //     });
  //   },
  //   function (test, expect) {
  //     Meteor.call("testNoSRPUpgrade", this.username, expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   // Changing our password should upgrade us to bcrypt.
  //   function (test, expect) {
  //     Accounts.changePassword("abcdef", "abcdefg", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   function (test, expect) {
  //     Meteor.call("testSRPUpgrade", this.username, expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   // And after the upgrade we should be able to change our password again.
  //   function (test, expect) {
  //     Accounts.changePassword("abcdefg", "abcdef", expect(function (error) {
  //       test.isFalse(error);
  //     }));
  //   },
  //   logoutStep
  // ]);
}) ();


if (Meteor.isServer) (function () {

}) ();
