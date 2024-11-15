import { Mongo } from 'meteor/mongo';
import { URL } from 'meteor/url';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';

Meteor.methods({
  getCurrentLoginToken: async function () {
    return Accounts._getLoginToken(this.connection.id);
  }
});

Tinytest.addAsync('accounts - config - token lifetime', async test => {
  const { loginExpirationInDays } = Accounts._options;
  Accounts._options.loginExpirationInDays = 2;
  test.equal(Accounts._getTokenLifetimeMs(), 2 * 24 * 60 * 60 * 1000);
  Accounts._options.loginExpirationInDays = loginExpirationInDays;
});

Tinytest.addAsync('accounts - config - unexpiring tokens', async test => {
  const { loginExpirationInDays } = Accounts._options;

  // When setting loginExpirationInDays to null in the global Accounts
  // config object, make sure the returned token lifetime represents an
  // unexpiring token date (is very far into the future).
  Accounts._options.loginExpirationInDays = null;
  test.equal(
    Accounts._getTokenLifetimeMs(),
    Accounts.LOGIN_UNEXPIRING_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  );

  // Verify token expiration date retrieval returns a Date.
  // (verifies https://github.com/meteor/meteor/issues/9066)
  test.isTrue(
    !isNaN(Accounts._tokenExpiration(new Date())),
    'Returned token expiration should be a Date',
  );

  // Verify the token expiration check works properly.
  // (verifies https://github.com/meteor/meteor/issues/9066)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 200);
  test.isFalse(Accounts._tokenExpiresSoon(futureDate));

  Accounts._options.loginExpirationInDays = loginExpirationInDays;
});

Tinytest.addAsync('accounts - config - default token lifetime', async test => {
  const options = Accounts._options;
  Accounts._options = {};
  test.equal(
    Accounts._getTokenLifetimeMs(),
    Accounts.DEFAULT_LOGIN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  );
  Accounts._options = options;
});

Tinytest.addAsync('accounts - config - defaultFieldSelector', async test => {
  const options = Accounts._options;
  Accounts._options = {};
  const setValue = { bigArray: 0 };
  Accounts.config({ defaultFieldSelector: setValue });
  test.equal(Accounts._options.defaultFieldSelector, setValue);
  Accounts._options = options;
});

const idsInValidateNewUser = {};
Accounts.validateNewUser(user => {
  idsInValidateNewUser[user._id] = true;
  return true;
});

Tinytest.addAsync('accounts - validateNewUser gets passed user with _id', async test => {
  const { userId } = await Accounts.updateOrCreateUserFromExternalService('foobook', { id: Random.id() });
  test.isTrue(userId in idsInValidateNewUser);
});

Tinytest.addAsync('accounts - insertUserDoc username', async test => {
  const userIn = {
    username: Random.id()
  };

  // user does not already exist. create a user object with fields set.
  const userId = await Accounts.insertUserDoc(
    { profile: { name: 'Foo Bar' } },
    userIn
  );
  const userOut = await Meteor.users.findOneAsync(userId);
  test.equal(typeof userOut.createdAt, 'object');
  test.equal(userOut.profile.name, 'Foo Bar');
  test.equal(userOut.username, userIn.username);

  // run the hook again. now the user exists, so it throws an error.
  await test.throwsAsync(
    async () => await Accounts.insertUserDoc({ profile: { name: 'Foo Bar' } }, userIn),
    'Username already exists.'
  );

  // cleanup
  await Meteor.users.removeAsync(userId);
});

Tinytest.addAsync('accounts - insertUserDoc email', async test => {
  const email1 = Random.id();
  const email2 = Random.id();
  const email3 = Random.id();
  const userIn = {
    emails: [{ address: email1, verified: false },
      { address: email2, verified: true }]
  };

  // user does not already exist. create a user object with fields set.
  const userId = await Accounts.insertUserDoc(
    { profile: { name: 'Foo Bar' } },
    userIn
  );
  const userOut = await Meteor.users.findOneAsync(userId);

  test.equal(typeof userOut.createdAt, 'object');
  test.equal(userOut.profile.name, 'Foo Bar');
  test.equal(userOut.emails, userIn.emails);

  // run the hook again with the exact same emails.
  // run the hook again. now the user exists, so it throws an error.
  await test.throwsAsync(
    async () => await Accounts.insertUserDoc({ profile: { name: 'Foo Bar' } }, userIn),
    'Email already exists.'
  );

  // now with only one of them.
  await test.throwsAsync(
    async () =>
      await Accounts.insertUserDoc({}, { emails: [{ address: email1 }] }),
    'Email already exists.'
  );

  await test.throwsAsync(
    async () =>
      await Accounts.insertUserDoc({}, { emails: [{ address: email2 }] }),
    'Email already exists.'
  );


  // a third email works.
  const userId3 = await Accounts.insertUserDoc(
    {}, { emails: [{ address: email3 }] }
  );
  const user3 = await Meteor.users.findOneAsync(userId3);
  test.equal(typeof user3.createdAt, 'object');

  // cleanup
  await Meteor.users.removeAsync(userId);
  await Meteor.users.removeAsync(userId3);
});

// More token expiration tests are in accounts-password
Tinytest.addAsync('accounts - expire numeric token', async (test, onComplete) => {
  const userIn = { username: Random.id() };
  const userId = await Accounts.insertUserDoc({
    profile: {
      name: 'Foo Bar'
    }
  }, userIn);
  const date = new Date(new Date() - 5000);
  await Meteor.users.updateAsync(userId, {
    $set: {
      "services.resume.loginTokens": [{
        hashedToken: Random.id(),
        when: date
      }, {
        hashedToken: Random.id(),
        when: +date
      }]
    }
  });
  const observe = await Meteor.users.find(userId).observe({
    changed: newUser => {
      if (newUser.services && newUser.services.resume &&
        (!newUser.services.resume.loginTokens ||
          newUser.services.resume.loginTokens.length === 0)) {
        observe.stop();
        onComplete();
      }
    }
  });
  await Accounts._expireTokens(new Date(), userId);
});


// Login tokens used to be stored unhashed in the database.  We want
// to make sure users can still login after upgrading.
const insertUnhashedLoginToken = async (userId, stampedToken) => {
  await Meteor.users.updateAsync(
    userId,
    { $push: { 'services.resume.loginTokens': stampedToken } }
  );
};

Tinytest.addAsync('accounts - login token', async (test) => {
  // Test that we can login when the database contains a leftover
  // old style unhashed login token.
  const userId1 =
    await Accounts.insertUserDoc({}, { username: Random.id() });
  const stampedToken1 = Accounts._generateStampedLoginToken();
  await insertUnhashedLoginToken(userId1, stampedToken1);
  let connection = DDP.connect(Meteor.absoluteUrl());
  await connection.callAsync('login', { resume: stampedToken1.token });
  connection.disconnect();

  // Steal the unhashed token from the database and use it to login.
  // This is a sanity check so that when we *can't* login with a
  // stolen *hashed* token, we know it's not a problem with the test.
  const userId2 =
    await Accounts.insertUserDoc({}, { username: Random.id() });
  await insertUnhashedLoginToken(userId2, Accounts._generateStampedLoginToken());
  const user2 = await Meteor.users.findOneAsync(userId2);
  const stolenToken1 = user2.services.resume.loginTokens[0].token;
  test.isTrue(stolenToken1);
  connection = DDP.connect(Meteor.absoluteUrl());
  await connection.callAsync('login', { resume: stolenToken1 });
  connection.disconnect();

  // Now do the same thing, this time with a stolen hashed token.
  const userId3 =
    await Accounts.insertUserDoc({}, { username: Random.id() });
  await Accounts._insertLoginToken(userId3, Accounts._generateStampedLoginToken());
  const user3 = await Meteor.users.findOneAsync(userId3);
  const stolenToken2 = user3.services.resume.loginTokens[0].hashedToken;
  test.isTrue(stolenToken2);
  connection = DDP.connect(Meteor.absoluteUrl());
  // evil plan foiled
  await test.throwsAsync(
    async () => await connection.callAsync('login', { resume: stolenToken2 }),
    /You\'ve been logged out by the server/
  );
  connection.disconnect();

  // Old style unhashed tokens are replaced by hashed tokens when
  // encountered.  This means that after someone logins once, the
  // old unhashed token is no longer available to be stolen.
  const userId4 =
    await Accounts.insertUserDoc({}, { username: Random.id() });
  const stampedToken2 = Accounts._generateStampedLoginToken();
  await insertUnhashedLoginToken(userId4, stampedToken2);
  connection = DDP.connect(Meteor.absoluteUrl());
  await connection.callAsync('login', { resume: stampedToken2.token });
  connection.disconnect();

  // The token is no longer available to be stolen.
  const user4 = await Meteor.users.findOneAsync(userId4);
  const stolenToken3 = user4.services.resume.loginTokens[0].token;
  test.isFalse(stolenToken3);

  // After the upgrade, the client can still login with their original
  // unhashed login token.
  connection = DDP.connect(Meteor.absoluteUrl());
  await connection.callAsync('login', { resume: stampedToken2.token });
  connection.disconnect();

});

Tinytest.addAsync(
  'accounts - connection data cleaned up',
  (test, onComplete) => {
    makeTestConnection(
      test,
      (clientConn, serverConn) => {
        // onClose callbacks are called in order, so we run after the
        // close callback in accounts.
        serverConn.onClose(() => {
          test.isFalse(Accounts._getAccountData(serverConn.id, 'connection'));
          onComplete();
        });

        test.isTrue(Accounts._getAccountData(serverConn.id, 'connection'));
        serverConn.close();
      },
      onComplete
    );
  }
);

Tinytest.addAsync('accounts - get new token', async test => {
    // Test that the `getNewToken` method returns us a valid token, with
    // the same expiration as our original token.
    const userId = await Accounts.insertUserDoc({}, { username: Random.id() });
    const stampedToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(userId, stampedToken);

    const conn = DDP.connect(Meteor.absoluteUrl());
    await conn.callAsync('login', { resume: stampedToken.token });
    test.equal(await conn.callAsync('getCurrentLoginToken'),
      Accounts._hashLoginToken(stampedToken.token));

    const newTokenResult = await conn.callAsync('getNewToken');
    test.equal(newTokenResult.tokenExpires,
      Accounts._tokenExpiration(stampedToken.when));
    const token = await conn.callAsync('getCurrentLoginToken');
    test.equal(await conn.callAsync('getCurrentLoginToken'),
      Accounts._hashLoginToken(newTokenResult.token));
    conn.disconnect();

    // A second connection should be able to log in with the new token
    // we got.
    const secondConn = DDP.connect(Meteor.absoluteUrl());
    await secondConn.callAsync('login', { resume: newTokenResult.token });
    secondConn.disconnect();
  }
);

Tinytest.addAsync('accounts - remove other tokens', async (test) => {
    // Test that the `removeOtherTokens` method removes all tokens other
    // than the caller's token, thereby logging out and closing other
    // connections.
    const userId = await Accounts.insertUserDoc({}, { username: Random.id() });
    const stampedTokens = [];
    const conns = [];

    for (let i = 0; i < 2; i++) {
      stampedTokens.push(Accounts._generateStampedLoginToken());
      await Accounts._insertLoginToken(userId, stampedTokens[i]);
      const conn = DDP.connect(Meteor.absoluteUrl());
      await conn.callAsync('login', { resume: stampedTokens[i].token });
      test.equal(await conn.callAsync('getCurrentLoginToken'),
        Accounts._hashLoginToken(stampedTokens[i].token));
      conns.push(conn);
    }
    ;

    await conns[0].callAsync('removeOtherTokens');
    simplePoll(async () => {
        let tokens = [];
        for (const conn of conns) {
          tokens.push(await conn.callAsync('getCurrentLoginToken'));
        }
        return !tokens[1] &&
          tokens[0] === Accounts._hashLoginToken(stampedTokens[0].token);
      },
      () => { // success
        conns.forEach(conn => conn.disconnect());
      },
      () => { // timed out
        throw new Error("accounts - remove other tokens timed out");
      }
    );
  }
);

Tinytest.addAsync(
  'accounts - hook callbacks can access Meteor.userId()',
  async test => {
    const userId = await Accounts.insertUserDoc({}, { username: Random.id() });
    const stampedToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(userId, stampedToken);

    const validateStopper = Accounts.validateLoginAttempt(attempt => {
      test.equal(Meteor.userId(), validateAttemptExpectedUserId, "validateLoginAttempt");
      return true;
    });
    const onLoginStopper = Accounts.onLogin(attempt =>
      test.equal(Meteor.userId(), onLoginExpectedUserId, "onLogin")
    );
    const onLogoutStopper = Accounts.onLogout(logoutContext => {
      test.equal(logoutContext.user._id, onLogoutExpectedUserId, "onLogout");
      test.instanceOf(logoutContext.connection, Object);
    });
    const onLoginFailureStopper = Accounts.onLoginFailure(attempt =>
      test.equal(Meteor.userId(), onLoginFailureExpectedUserId, "onLoginFailure")
    );

    const conn = DDP.connect(Meteor.absoluteUrl());

    // On a new connection, Meteor.userId() should be null until logged in.
    let validateAttemptExpectedUserId = null;
    const onLoginExpectedUserId = userId;
    await conn.callAsync('login', { resume: stampedToken.token });

    // Now that the user is logged in on the connection, Meteor.userId() should
    // return that user.
    validateAttemptExpectedUserId = userId;
    await conn.callAsync('login', { resume: stampedToken.token });

    // Trigger onLoginFailure callbacks
    const onLoginFailureExpectedUserId = userId;
    await test.throwsAsync(
      async () =>
        await conn.callAsync('login', { resume: "bogus" }), '403');

    // Trigger onLogout callbacks
    const onLogoutExpectedUserId = userId;
    await conn.callAsync('logout');

    conn.disconnect();
    validateStopper.stop();
    onLoginStopper.stop();
    onLogoutStopper.stop();
    onLoginFailureStopper.stop();
  }
);

Tinytest.addAsync(
  'accounts - hook callbacks obey options.defaultFieldSelector',
  async test => {
    const ignoreFieldName = "bigArray";
    const userId =
      await Accounts.insertUserDoc({}, { username: Random.id(), [ignoreFieldName]: [1] });
    const stampedToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(userId, stampedToken);
    const options = Accounts._options;
    Accounts._options = {};
    Accounts.config({ defaultFieldSelector: { [ignoreFieldName]: 0 } });
    test.equal(Accounts._options.defaultFieldSelector, { [ignoreFieldName]: 0 }, 'defaultFieldSelector');

    const validateStopper = Accounts.validateLoginAttempt(attempt => {
      test.isUndefined(allowLogin != 'bogus' ? attempt.user[ignoreFieldName] : attempt.user, "validateLoginAttempt")
      return allowLogin;
    });
    const onLoginStopper = Accounts.onLogin(attempt =>
      test.isUndefined(attempt.user[ignoreFieldName], "onLogin")
    );
    const onLogoutStopper = Accounts.onLogout(logoutContext =>
      test.isUndefined(logoutContext.user[ignoreFieldName], "onLogout")
    );
    const onLoginFailureStopper = Accounts.onLoginFailure(attempt =>
      test.isUndefined(allowLogin != 'bogus' ? attempt.user[ignoreFieldName] : attempt.user, "onLoginFailure")
    );

    const conn = DDP.connect(Meteor.absoluteUrl());

    // test a new connection
    let allowLogin = true;
    await conn.callAsync('login', { resume: stampedToken.token });

    // Now that the user is logged in on the connection, Meteor.userId() should
    // return that user.
    await conn.callAsync('login', { resume: stampedToken.token });

    // Trigger onLoginFailure callbacks, this will not include the user object
    allowLogin = 'bogus';
    await test.throwsAsync(
      async () =>
        await conn.callAsync('login', { resume: "bogus" }), '403');

    // test a forced login fail which WILL include the user object
    allowLogin = false;
    await test.throwsAsync(
      async () =>
        await conn.callAsync('login', { resume: stampedToken.token }), '403');

    // Trigger onLogout callbacks
    const onLogoutExpectedUserId = userId;
    await conn.callAsync('logout');

    Accounts._options = options;
    conn.disconnect();
    validateStopper.stop();
    onLoginStopper.stop();
    onLogoutStopper.stop();
    onLoginFailureStopper.stop();
  }
);

Tinytest.addAsync(
  'accounts - Meteor.user() obeys options.defaultFieldSelector',
  async test => {
    const ignoreFieldName = "bigArray";
    const customField = "customField";
    const userId =
      await Accounts.insertUserDoc({}, { username: Random.id(), [ignoreFieldName]: [1], [customField]: 'test' });
    const stampedToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(userId, stampedToken);
    const options = Accounts._options;

    // stub Meteor.userId() so it works outside methods and returns the correct user:
    const origAccountsUserId = Accounts.userId;
    Accounts.userId =
      () => userId;

    Accounts._options = {};

    // test the field is included by default
    let user = await Meteor.userAsync();
    test.isNotUndefined(user[ignoreFieldName], 'included by default');

    // test the field is excluded
    Accounts.config({ defaultFieldSelector: { [ignoreFieldName]: 0 } });
    user = await Meteor.userAsync();
    test.isUndefined(user[ignoreFieldName], 'excluded');
    user = await Meteor.userAsync({});
    test.isUndefined(user[ignoreFieldName], 'excluded {}');

    // test the field can still be retrieved if required
    user = await Meteor.userAsync({ fields: { [ignoreFieldName]: 1 } });
    test.isNotUndefined(user[ignoreFieldName], 'field can be retrieved');
    test.isUndefined(user.username, 'field can be retrieved username');

    // test a combined negative field specifier
    user = await Meteor.userAsync({ fields: { username: 0 } });
    test.isUndefined(user[ignoreFieldName], 'combined field selector');
    test.isUndefined(user.username, 'combined field selector username');

    // test an explicit request for the full user object
    user = await Meteor.userAsync({ fields: {} });
    test.isNotUndefined(user[ignoreFieldName], 'full selector');
    test.isNotUndefined(user.username, 'full selector username');

    Accounts._options = {};

    // Test that a custom field gets retrieved properly
    Accounts.config({ defaultFieldSelector: { [customField]: 1 } });
    user = await Meteor.userAsync()
    test.isNotUndefined(user[customField]);
    test.isUndefined(user.username);
    test.isUndefined(user[ignoreFieldName]);

    Accounts._options = options;
    Accounts.userId = origAccountsUserId;
  }
);


Tinytest.addAsync(
  'accounts async - Meteor.userAsync() obeys options.defaultFieldSelector',
  async test => {
    const ignoreFieldName = "bigArray";
    const customField = "customField";
    const userId =
      await Accounts.insertUserDoc({}, { username: Random.id(), [ignoreFieldName]: [1], [customField]: 'test' });
    const stampedToken = Accounts._generateStampedLoginToken();
    await Accounts._insertLoginToken(userId, stampedToken);
    const options = Accounts._options;

    // stub Meteor.userId() so it works outside methods and returns the correct user:
    const origAccountsUserId = Accounts.userId;
    Accounts.userId =
      () => userId;

    Accounts._options = {};

    // test the field is included by default
    let user = await Meteor.userAsync();
    test.isNotUndefined(user[ignoreFieldName], 'included by default');

    // test the field is excluded
    Accounts.config({ defaultFieldSelector: { [ignoreFieldName]: 0 } });
    user = await Meteor.userAsync();
    test.isUndefined(user[ignoreFieldName], 'excluded');
    user = await Meteor.userAsync({});
    test.isUndefined(user[ignoreFieldName], 'excluded {}');

    // test the field can still be retrieved if required
    user = await Meteor.userAsync({ fields: { [ignoreFieldName]: 1 } });
    test.isNotUndefined(user[ignoreFieldName], 'field can be retrieved');
    test.isUndefined(user.username, 'field can be retrieved username');

    // test a combined negative field specifier
    user = await Meteor.userAsync({ fields: { username: 0 } });
    test.isUndefined(user[ignoreFieldName], 'combined field selector');
    test.isUndefined(user.username, 'combined field selector username');

    // test an explicit request for the full user object
    user = await Meteor.userAsync({ fields: {} });
    test.isNotUndefined(user[ignoreFieldName], 'full selector');
    test.isNotUndefined(user.username, 'full selector username');

    Accounts._options = {};

    // Test that a custom field gets retrieved properly
    Accounts.config({ defaultFieldSelector: { [customField]: 1 } });
    user = await Meteor.userAsync();
    test.isNotUndefined(user[customField]);
    test.isUndefined(user.username);
    test.isUndefined(user[ignoreFieldName]);

    Accounts._options = options;
    Accounts.userId = origAccountsUserId;
  }
);
Tinytest.addAsync(
  'accounts - verify onExternalLogin hook can update oauth user profiles',
  async test => {
    // Verify user profile data is saved properly when not using the
    // onExternalLogin hook.
    let facebookId = Random.id();
    const u1 = await Accounts.updateOrCreateUserFromExternalService(
      'facebook',
      { id: facebookId },
      { profile: { foo: 1 } },
    );
    const ignoreFieldName = "bigArray";

    const c =
      await Meteor.users.updateAsync(u1.userId, { $set: { [ignoreFieldName]: [1] } });

    let users =
      await Meteor.users.find({ 'services.facebook.id': facebookId }).fetch();

    test.length(users, 1);
    test.equal(users[0].profile.foo, 1);
    test.isNotUndefined(users[0][ignoreFieldName], 'ignoreField - before limit fields');

    // Verify user profile data can be modified using the onExternalLogin
    // hook, for existing users.
    // Also verify that the user object is filtered by _options.defaultFieldSelector
    const accountsOptions = Accounts._options;
    Accounts._options = {};
    Accounts.config({ defaultFieldSelector: { [ignoreFieldName]: 0 } });
    Accounts.onExternalLogin((options, user) => {
      options.profile.foo = 2;
      test.isUndefined(users[ignoreFieldName], 'ignoreField - after limit fields');
      return options;
    });
    await Accounts.updateOrCreateUserFromExternalService(
      'facebook',
      { id: facebookId },
      { profile: { foo: 1 } },
    );
    // test.isUndefined(users[0][ignoreFieldName], 'ignoreField - fields limited');
    users = await Meteor.users.find({ 'services.facebook.id': facebookId }).fetch();
    test.length(users, 1);
    test.equal(users[0].profile.foo, 2);
    test.isNotUndefined(users[0][ignoreFieldName], 'ignoreField - still there');

    // Verify user profile data can be modified using the onExternalLogin
    // hook, for new users.
    facebookId = Random.id();
    const u2 = await Accounts.updateOrCreateUserFromExternalService(
      'facebook',
      { id: facebookId },
      { profile: { foo: 3 } },
    );
    users = await Meteor.users.find({ 'services.facebook.id': facebookId }).fetch();
    test.length(users, 1);
    test.equal(users[0].profile.foo, 2);

    // Cleanup
    await Meteor.users.removeAsync(u1);
    await Meteor.users.removeAsync(u2.userId);
    Accounts._onExternalLoginHook = null;
    Accounts._options = accountsOptions;
  }
);

Tinytest.addAsync(
  'accounts - verify beforeExternalLogin hook can stop user login',
  async test => {
    // Verify user data is saved properly when not using the
    // beforeExternalLogin hook.
    let facebookId = Random.id();

    const u =
      await Accounts.updateOrCreateUserFromExternalService(
        'facebook',
        { id: facebookId },
        { profile: { foo: 1 } },
      );

    const ignoreFieldName = "bigArray";

    const c =
      await Meteor.users.updateAsync(u.userId, { $set: { [ignoreFieldName]: [1] } });

    let users =
      await Meteor.users.find({ 'services.facebook.id': facebookId }).fetch();

    test.length(users, 1);
    test.equal(users[0].profile.foo, 1);
    test.isNotUndefined(users[0][ignoreFieldName], 'ignoreField - before limit fields');

    // Verify that when beforeExternalLogin returns false
    // that an error throws and user is not saved
    Accounts.beforeExternalLogin((serviceName, serviceData, user) => {
      // Check that we get the correct data
      test.equal(serviceName, 'facebook');
      test.equal(serviceData, { id: facebookId });
      test.equal(user._id, u.userId);
      return false
    });

    await test.throwsAsync(
      async () =>
        await Accounts.updateOrCreateUserFromExternalService(
          'facebook',
          { id: facebookId },
          { profile: { foo: 1 } },
        ));

    // Cleanup
    await Meteor.users.removeAsync(u.userId);
    Accounts._beforeExternalLoginHook = null;
  }
);

Tinytest.addAsync(
  'accounts - verify setAdditionalFindUserOnExternalLogin hook can provide user',
  async test => {
    // create test user, without a google service
    const testEmail = "test@testdomain.com"
    // being sure that the user is not already in the database
    await Meteor.users.removeAsync({ "emails.address": testEmail });
    const uid0 = await Accounts.createUser({ email: testEmail })

    // Verify that user is found from email and service merged
    Accounts.setAdditionalFindUserOnExternalLogin(async ({ serviceName, serviceData }) => {
      if (serviceName === "google") {
        return await Accounts.findUserByEmail(serviceData.email)
      }
    })

    let googleId = Random.id();
    const u1 = await Accounts.updateOrCreateUserFromExternalService(
      'google',
      { id: googleId, email: testEmail },
      { profile: { foo: 1 } },
    );
    test.equal(uid0, u1.userId)

    // Cleanup
    if (u1.userId !== uid0) {
      await Meteor.users.removeAsync(uid0)
    }
    await Meteor.users.removeAsync(u1.userId);
    Accounts.selectCustomUserOnExternalLogin = null;
  }
);

if (Meteor.isServer) {
  Tinytest.addAsync('accounts - config - collection - mongo.collection', async test => {
    const origCollection = Accounts.users;
    // create same user in two different collections - should pass
    const email = "test-collection@testdomain.com"

    const collection0 = new Mongo.Collection('test1');

    Accounts.config({
      collection: collection0,
    })
    const uid0 = await Accounts.createUser({email})
    await Meteor.users.removeAsync(uid0);

    const collection1 = new Mongo.Collection('test2');
    Accounts.config({
      collection: collection1,
    })
    const uid1 = await Accounts.createUser({email})

    await Meteor.users.removeAsync(uid1);
    test.notEqual(uid0, uid1);

    Accounts.config({
      collection: origCollection,
    });
  });
  Tinytest.addAsync('accounts - config - collection - name', async test => {
    const origCollection = Accounts.users;
    // create same user in two different collections - should pass
    const email = "test-collection@testdomain.com"

    Accounts.config({
      collection: 'collection0',
    })
    const uid0 = await Accounts.createUser({email})
    await Meteor.users.removeAsync(uid0);

    Accounts.config({
      collection: 'collection1',
    })
    const uid1 = await Accounts.createUser({email})
    await Meteor.users.removeAsync(uid1);

    test.notEqual(uid0, uid1);

    Accounts.config({
      collection: origCollection,
    });
  });

  Tinytest.add(
    'accounts - make sure that extra params to accounts urls are added',
    async test => {
      // No extra params
      const verifyEmailURL = new URL(Accounts.urls.verifyEmail('test'));
      test.equal(verifyEmailURL.searchParams.toString(), "");

      // Extra params
      const extraParams = { test: 'success' };
      const resetPasswordURL = new URL(Accounts.urls.resetPassword('test', extraParams));
      test.equal(resetPasswordURL.searchParams.get('test'), extraParams.test);
      const enrollAccountURL = new URL(Accounts.urls.enrollAccount('test', extraParams));
      test.equal(enrollAccountURL.searchParams.get('test'), extraParams.test);
    }
  );
}

Tinytest.addAsync('accounts - updateOrCreateUserFromExternalService - Facebook', async test => {
  const facebookId = Random.id();

  // create an account with facebook
  const u1 =
    await Accounts.updateOrCreateUserFromExternalService(
      'facebook', { id: facebookId, monkey: 42 }, { profile: { foo: 1 } });
  const users1 =
    await Meteor.users.find({ "services.facebook.id": facebookId }).fetch();
  test.length(users1, 1);
  test.equal(users1[0].profile.foo, 1);
  test.equal(users1[0].services.facebook.monkey, 42);

  // create again with the same id, see that we get the same user.
  // it should update services.facebook but not profile.
  const u2 =
    await Accounts.updateOrCreateUserFromExternalService(
      'facebook', { id: facebookId, llama: 50 },
      { profile: { foo: 1000, bar: 2 } });
  test.equal(u1.id, u2.id);
  const users2 =
    await Meteor.users.find({ "services.facebook.id": facebookId }).fetch();
  test.length(users2, 1);
  test.equal(users2[0].profile.foo, 1);
  test.equal(users2[0].profile.bar, undefined);
  test.equal(users2[0].services.facebook.llama, 50);
  // make sure we *don't* lose values not passed this call to
  // updateOrCreateUserFromExternalService
  test.equal(users2[0].services.facebook.monkey, 42);

  // cleanup
  await Meteor.users.removeAsync(u1.id);
});

Tinytest.addAsync('accounts - updateOrCreateUserFromExternalService - Meteor Developer', async test => {
  const developerId =
    Random.id();
  const u1 =
    await Accounts.updateOrCreateUserFromExternalService(
      'meteor-developer',
      { id: developerId, username: 'meteor-developer' },
      { profile: { name: 'meteor-developer' } }
    );
  const users1 =
    await Meteor.users.find({ 'services.meteor-developer.id': developerId }).fetch();
  test.length(users1, 1);
  test.equal(users1[0].profile.name, 'meteor-developer');

  const u2 =
    await Accounts.updateOrCreateUserFromExternalService(
      'meteor-developer',
      { id: developerId, username: 'meteor-developer' },
      { profile: { name: 'meteor-developer', username: 'developer' } }
    );
  test.equal(u1.id, u2.id);
  const users2 =
    await Meteor.users.find({ 'services.meteor-developer.id': developerId }).fetch();
  test.length(users2, 1);
  test.equal(users1[0].profile.name, 'meteor-developer');
  test.equal(users1[0].profile.username, undefined);

  // cleanup
  await Meteor.users.removeAsync(u1);
});

Tinytest.addAsync('accounts - updateOrCreateUserFromExternalService - Weibo', async test => {
  const weiboId1 =
    Random.id();
  const weiboId2 =
    Random.id();

  // users that have different service ids get different users
  const u1 =
    await Accounts.updateOrCreateUserFromExternalService(
      'weibo', { id: weiboId1 }, { profile: { foo: 1 } });
  const u2 =
    await Accounts.updateOrCreateUserFromExternalService(
      'weibo', { id: weiboId2 }, { profile: { bar: 2 } });
  test.equal(await Meteor.users.find({ "services.weibo.id": { $in: [weiboId1, weiboId2] } }).countAsync(), 2);

  const user1 =
    await Meteor.users.findOneAsync({ "services.weibo.id": weiboId1 });
  const user2 =
    await Meteor.users.findOneAsync({ "services.weibo.id": weiboId2 });
  test.equal(user1.profile.foo, 1);
  test.equal(user1.emails, undefined);
  test.equal(user2.profile.bar, 2);
  test.equal(user2.emails, undefined);

  // cleanup
  Meteor.users.removeAsync(u1.id);
  Meteor.users.removeAsync(u2.id);
});

Tinytest.addAsync('accounts - updateOrCreateUserFromExternalService - Twitter', async test => {
  const twitterIdOld = parseInt(Random.hexString(4), 16);
  const twitterIdNew = '' + twitterIdOld;

  // create an account with twitter using the old ID format of integer
  const u1 =
    await Accounts.updateOrCreateUserFromExternalService(
      'twitter', { id: twitterIdOld, monkey: 42 }, { profile: { foo: 1 } });
  const users1 =
    await Meteor.users.find({ "services.twitter.id": twitterIdOld }).fetch();
  test.length(users1, 1);
  test.equal(users1[0].profile.foo, 1);
  test.equal(users1[0].services.twitter.monkey, 42);

  // Update the account with the new ID format of string
  // test that the existing user is found, and that the ID
  // gets updated to a string value
  const u2 =
    await Accounts.updateOrCreateUserFromExternalService(
      'twitter', { id: twitterIdNew, monkey: 42 }, { profile: { foo: 1 } });
  test.equal(u1.id, u2.id);
  const users2 =
    await Meteor.users.find({ "services.twitter.id": twitterIdNew }).fetch();
  test.length(users2, 1);

  // cleanup
  await Meteor.users.removeAsync(u1.id);
});
