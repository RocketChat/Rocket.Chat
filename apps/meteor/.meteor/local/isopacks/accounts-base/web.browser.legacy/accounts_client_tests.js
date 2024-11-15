import {Accounts} from "meteor/accounts-base";
import { AccountsClient } from './accounts_client';

const username = 'jsmith';
const password = 'password';
const excludeField = 'excludeField';
const defaultExcludeField = 'defaultExcludeField';
const excludeValue = 'foo';
const secret2fa = 'shhhh';
const profile = {
  name: username,
  [excludeField]: excludeValue,
  [defaultExcludeField]: excludeValue,
};

const logoutAndCreateUser = (test, done, nextTests) => {
  Meteor.logout(() => {
    // Make sure we're logged out to start with
    test.isFalse(Meteor.user());

    // Setup a new test user
    Accounts.createUser({ username, password, profile }, () => {
      // Handle next tests
      nextTests(test, done);
    });
  });
};

const createUserAndLogout = (test, done, nextTests) => {
  // Setup a new test user
  Accounts.createUser(
    {
      username,
      password,
      profile: {
        name: username,
      },
    },
    () => {
      Meteor.logout(async () => {
        // Make sure we're logged out
        test.isFalse(await Meteor.userAsync());
        // Handle next tests
        nextTests(test, done);
      });
    }
  );
};

const removeTestUser = done => {
  Meteor.callAsync('removeAccountsTestUser', username).then(() => {
    done();
  });
};

const forceEnableUser2fa = done => {
  Meteor.callAsync('forceEnableUser2fa', { username }, secret2fa).then((token) => {
    done(token);
  });
};

const getTokenFromSecret = done => {
  Meteor.call(
    'getTokenFromSecret',
    { selector: { username } },
    (err, token) => {
      done(token);
    }
  );
};

Tinytest.addAsync(
  'accounts - Meteor.loggingIn() is true right after a login call',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Login then immediately verify loggingIn is true
      Meteor.loginWithPassword(username, password);
      test.isTrue(Meteor.loggingIn());
      removeTestUser(done);
    });
  }
);

Tinytest.addAsync(
  'accounts - Meteor.loggingIn() is false after login has completed',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Login then verify loggingIn is false after login has completed
      Meteor.loginWithPassword(username, password, () => {
        test.isTrue(Meteor.user());
        test.isFalse(Meteor.loggingIn());
        removeTestUser(done);
      });
    });
  }
);

Tinytest.addAsync(
  'accounts async - Meteor.loggingIn() is false after login has completed',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Login then verify loggingIn is false after login has completed
      Meteor.loginWithPassword(username, password, async () => {
        test.isFalse(Meteor.loggingIn());
        test.isTrue(await Meteor.userAsync());
        removeTestUser(done);
      });
    });
  }
);

Tinytest.addAsync(
  'accounts - Meteor.loggingOut() is true right after a logout call',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Logout then immediately verify loggingOut is true
      Meteor.logout();
      test.isTrue(Meteor.loggingOut());
      removeTestUser(done);
    });
  }
);

Tinytest.addAsync(
  'accounts - Meteor.loggingOut() is false after logout has completed',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Logout then verify loggingOut is false after logout has completed
      Meteor.logout((error) => {
        test.isFalse(Meteor.user());
        test.isFalse(Meteor.loggingOut());
        removeTestUser(done);
      });
    });
  }
);

Tinytest.addAsync(
  'accounts - onLogin callback receives { type: "password" } param on login',
  (test, done) => {
    const onLogin = Accounts.onLogin((loginDetails) => {
      test.equal('password', loginDetails.type);
      onLogin.stop();
      removeTestUser(done);
    });
    logoutAndCreateUser(test, done, () => {});
  }
);

Tinytest.addAsync(
  'accounts - onLogin callback receives { type: "resume" } param on ' +
  'reconnect, if already logged in',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      const onLogin = Accounts.onLogin((loginDetails) => {
        test.equal('resume', loginDetails.type);
        onLogin.stop();
        removeTestUser(done);
      });

      Meteor.disconnect();
      Meteor.reconnect();
    });
  }
);

Tinytest.addAsync(
  'accounts - Meteor.user() obeys explicit and default field selectors',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      Meteor.loginWithPassword(username, password, () => {
        // by default, all fields should be returned
        test.equal(Meteor.user().profile[excludeField], excludeValue);

        // this time we want to exclude the default fields
        const options = Accounts._options;
        Accounts._options = {};
        Accounts.config({defaultFieldSelector: {['profile.'+defaultExcludeField]: 0}});
        let user = Meteor.user();
        test.isUndefined(user.profile[defaultExcludeField]);
        test.equal(user.profile[excludeField], excludeValue);
        test.equal(user.profile.name, username);

        // this time we only want certain fields...
        user = Meteor.user({fields: {'profile.name': 1}});
        test.isUndefined(user.profile[excludeField]);
        test.isUndefined(user.profile[defaultExcludeField]);
        test.equal(user.profile.name, username);
        Accounts._options = options;
        removeTestUser(done);
      });
    });
  }
);

Tinytest.addAsync(
  'accounts async - Meteor.userAsync() obeys explicit and default field selectors',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      Meteor.loginWithPassword(username, password, async () => {
        // by default, all fields should be returned
        let user;
        user = await Meteor.userAsync();
        test.equal(user.profile[excludeField], excludeValue);

        // this time we want to exclude the default fields
        const options = Accounts._options;
        Accounts._options = {};
        Accounts.config({ defaultFieldSelector: { ['profile.' + defaultExcludeField]: 0 } });

        user = await Meteor.userAsync();
        test.isUndefined(user.profile[defaultExcludeField]);
        test.equal(user.profile[excludeField], excludeValue);
        test.equal(user.profile.name, username);

        // this time we only want certain fields...

        user = await Meteor.userAsync({ fields: { 'profile.name': 1 } });
        test.isUndefined(user.profile[excludeField]);
        test.isUndefined(user.profile[defaultExcludeField]);
        test.equal(user.profile.name, username);
        Accounts._options = options;
        removeTestUser(done);
      });
    });
  }
);

Tinytest.addAsync(
  'accounts-2fa - Meteor.loginWithPasswordAnd2faCode() fails when token is not provided',
  (test, done) => {
    createUserAndLogout(test, done, () => {
      try {
        Meteor.loginWithPasswordAnd2faCode(username, password);
      } catch (e) {
        test.equal(
          e.reason,
          'token is required to use loginWithPasswordAnd2faCode and must be a string'
        );
      } finally {
        test.isFalse(Meteor.user());
        removeTestUser(done);
      }
    });
  }
);


 Tinytest.addAsync(
  'accounts-2fa - Meteor.loginWithPasswordAnd2faCode() fails with invalid code',
  (test, done) => {
    createUserAndLogout(test, done, () => {
      forceEnableUser2fa(() => {
        Meteor.loginWithPasswordAnd2faCode(username, password, 'ABC', async e => {
          test.isFalse(await Meteor.user());
          test.equal(e.reason, 'Invalid 2FA code');
          removeTestUser(done);
        });
      });
    });
  }
);

Tinytest.addAsync(
  'accounts-2fa - Meteor.loginWithPasswordAnd2faCode() succeeds when token is correct',
  (test, done) => {
    createUserAndLogout(test, done, () => {
      forceEnableUser2fa((token) => {
        Meteor.loginWithPasswordAnd2faCode(username, password, token, e => {
          test.equal(e, undefined);
          test.isTrue(Meteor.user());
          removeTestUser(done);
        });
      });
    });
  }
);

Tinytest.addAsync(
  'accounts-2fa - Generates secret, enable 2fa, verifies if 2fa is enabled, disable 2fa, verifies if 2fa is disabled',
  (test, done) => {
    logoutAndCreateUser(test, done, () => {
      // Generates secret
      Accounts.generate2faActivationQrCode('test', (err, svg) => {
        test.isTrue(svg != null);
        getTokenFromSecret(token => {
          // enable 2fa
          Accounts.enableUser2fa(token, () => {
            // verifies if 2fa is enabled
            Accounts.has2faEnabled((err, isEnabled) => {
              test.isTrue(isEnabled);
              // disable 2fa
              Accounts.disableUser2fa(() => {
                // verifies if 2fa is disabled
                Accounts.has2faEnabled((err, isEnabled) => {
                  test.isFalse(!!isEnabled);
                  removeTestUser(done);
                });
              });
            });
          });
        });
      });
    });
  }
);

Tinytest.addAsync('accounts - storage',
  async function(test) {
    const expectWhenSessionStorage = () => {
      test.isNotUndefined(sessionStorage.getItem('Meteor.loginToken'));
      test.isNull(localStorage.getItem('Meteor.loginToken'));
    };
    const expectWhenLocalStorage = () => {
      test.isNotUndefined(localStorage.getItem('Meteor.loginToken'));
      test.isNull(sessionStorage.getItem('Meteor.loginToken'));
    };

    const testCases = [{
      clientStorage: undefined,
      expectStorage: expectWhenLocalStorage,
    }, {
      clientStorage: 'local',
      expectStorage: expectWhenLocalStorage,
    }, {
      clientStorage: 'session',
      expectStorage: expectWhenSessionStorage,
    }];
    for await (const testCase of testCases) {
      await new Promise(resolve => {
        sessionStorage.clear();
        localStorage.clear();

        const { clientStorage, expectStorage } = testCase;
        Accounts.config({ clientStorage });
        test.equal(Accounts._options.clientStorage, clientStorage);

        // Login a user and test that tokens are in expected storage
        logoutAndCreateUser(test, resolve, () => {
          Accounts.logout();
          expectStorage();
          removeTestUser(resolve);
        });
      });
    }
  });

Tinytest.addAsync('accounts - should only start subscription when connected', async function (test) {
  const { conn, messages, cleanup } = await captureConnectionMessagesClient(test);

  const acc = new AccountsClient({
    connection: conn,
  })

  acc.callLoginMethod()

  await Meteor._sleepForMs(100);

  // The sub call needs to come right after `connect` since this is when `status().connected` gets to be true and
  // not after `connected` as it is based on the socket connection status.
  const expectedMessages = ['connect', 'method', 'sub', 'connected', 'updated', 'result', 'ready']

  const parsedMessages = messages.map(m => m.msg).filter(Boolean).filter(m => m !== 'added')

  test.equal(parsedMessages, expectedMessages)

  cleanup()
});