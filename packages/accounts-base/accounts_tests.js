Meteor.methods({
  getCurrentLoginToken: function () {
    return Accounts._getLoginToken(this.connection.id);
  }
});

// XXX it'd be cool to also test that the right thing happens if options
// *are* validated, but Accounts._options is global state which makes this hard
// (impossible?)
Tinytest.add('accounts - config validates keys', function (test) {
  test.throws(function () {
    Accounts.config({foo: "bar"});
  });
});


var idsInValidateNewUser = {};
Accounts.validateNewUser(function (user) {
  idsInValidateNewUser[user._id] = true;
  return true;
});

Tinytest.add('accounts - validateNewUser gets passed user with _id', function (test) {
  var newUserId = Accounts.updateOrCreateUserFromExternalService('foobook', {id: Random.id()}).userId;
  test.isTrue(newUserId in idsInValidateNewUser);
});

Tinytest.add('accounts - updateOrCreateUserFromExternalService - Facebook', function (test) {
  var facebookId = Random.id();

  // create an account with facebook
  var uid1 = Accounts.updateOrCreateUserFromExternalService(
    'facebook', {id: facebookId, monkey: "42"}).id;

  var user = Accounts.dbClient.getUserByServiceIdAndName("facebook", facebookId);
  test.equal(user.services.facebook.monkey, "42");

  // create again with the same id, see that we get the same user.
  // it should update services.facebook but not profile.
  var uid2 = Accounts.updateOrCreateUserFromExternalService(
    'facebook', {id: facebookId, llama: "50"}).id;
  test.equal(uid1, uid2);

  var user = Accounts.dbClient.getUserByServiceIdAndName("facebook", facebookId);
  // setServiceData is not implemented, because we need to do an upsert
  test.equal(user.services.facebook.llama, "50");

  // make sure we *don't* lose values not passed this call to
  // updateOrCreateUserFromExternalService
  test.equal(user.services.facebook.monkey, "42");

  // cleanup
  Accounts.dbClient.deleteUser(uid1);
});

Tinytest.add('accounts - updateOrCreateUserFromExternalService - Weibo', function (test) {
  var weiboId1 = Random.id();
  var weiboId2 = Random.id();

  // users that have different service ids get different users
  var uid1 = Accounts.updateOrCreateUserFromExternalService(
    'weibo', {id: weiboId1}).userId;
  var uid2 = Accounts.updateOrCreateUserFromExternalService(
    'weibo', {id: weiboId2}).userId;

  test.notEqual(uid1, uid2);

  // cleanup
  Accounts.dbClient.deleteUser(uid1);
  Accounts.dbClient.deleteUser(uid2);
});

Tinytest.add('accounts - insertUserDoc username', function (test) {
  var userIn = {
    username: Random.id()
  };

  // user does not already exist. create a user object with fields set.
  var userId = Accounts.insertUserDoc(
    {},
    userIn
  );

  var userOut = Accounts.dbClient.getUserById(userId);

  test.equal(typeof userOut.createdAt, 'object');
  test.equal(userOut.username, userIn.username);

  // run the hook again. now the user exists, so it throws an error.
  test.throws(function () {
    Accounts.insertUserDoc({}, userIn);
  }, /Username already exists./);

  // cleanup
  Accounts.dbClient.deleteUser(userId);
});

Tinytest.add('accounts - insertUserDoc email', function (test) {
  var email1 = Random.id();
  var email2 = Random.id();
  var email3 = Random.id();
  var userIn = {
    emails: [{address: email1, verified: false},
             {address: email2, verified: true}]
  };

  // user does not already exist. create a user object with fields set.
  var userId = Accounts.insertUserDoc({},
    userIn
  );
  var userOut = Accounts.dbClient.getUserById(userId);

  test.equal(typeof userOut.createdAt, 'object');
  test.equal(userOut.emails, userIn.emails);

  // run the hook again with the exact same emails.
  // run the hook again. now the user exists, so it throws an error.
  test.throws(function () {
    Accounts.insertUserDoc(
      {},
      userIn
    );
  });

  // now with only one of them.
  test.throws(function () {
    Accounts.insertUserDoc(
      {}, {emails: [{address: email1}]}
    );
  });

  test.throws(function () {
    Accounts.insertUserDoc(
      {}, {emails: [{address: email2}]}
    );
  });


  // a third email works.
  var userId3 = Accounts.insertUserDoc(
      {}, {emails: [{address: email3}]}
  );
  var user3 = Accounts.dbClient.getUserById(userId3);
  test.equal(typeof user3.createdAt, 'object');

  // cleanup
  Accounts.dbClient.deleteUser(userId);
  Accounts.dbClient.deleteUser(userId3);
});

// // More token expiration tests are in accounts-password
// Tinytest.addAsync('accounts - expire numeric token', function (test, onComplete) {
//   var userIn = { username: Random.id() };
//   var userId = Accounts.insertUserDoc({ profile: {
//     name: 'Foo Bar'
//   } }, userIn);
//   var date = new Date(new Date() - 5000);
//   Meteor.users.update(userId, {
//     $set: {
//       "services.resume.loginTokens": [{
//         hashedToken: Random.id(),
//         when: date
//       }, {
//         hashedToken: Random.id(),
//         when: +date
//       }]
//     }
//   });
//   var observe = Meteor.users.find(userId).observe({
//     changed: function (newUser) {
//       if (newUser.services && newUser.services.resume &&
//           _.isEmpty(newUser.services.resume.loginTokens)) {
//         observe.stop();
//         onComplete();
//       }
//     }
//   });
//   Accounts._expireTokens(new Date(), userId);
// });

Tinytest.addAsync(
  'accounts - connection data cleaned up',
  function (test, onComplete) {
    makeTestConnection(
      test,
      function (clientConn, serverConn) {
        // onClose callbacks are called in order, so we run after the
        // close callback in accounts.
        serverConn.onClose(function () {
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

Tinytest.add(
  'accounts - get new token',
  function (test) {
    // Test that the `getNewToken` method returns us a valid token, with
    // the same expiration as our original token.
    var userId = Accounts.insertUserDoc({}, { username: Random.id() });
    var stampedToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(userId, stampedToken);
    var conn = DDP.connect(Meteor.absoluteUrl());
    conn.call('login', { resume: stampedToken.token });
    test.equal(conn.call('getCurrentLoginToken'),
               Accounts._hashLoginToken(stampedToken.token));

    var newTokenResult = conn.call('getNewToken');
    test.equal(newTokenResult.tokenExpires,
               Accounts._tokenExpiration(stampedToken.when));
    test.equal(conn.call('getCurrentLoginToken'),
               Accounts._hashLoginToken(newTokenResult.token));
    conn.disconnect();

    // A second connection should be able to log in with the new token
    // we got.
    var secondConn = DDP.connect(Meteor.absoluteUrl());
    secondConn.call('login', { resume: newTokenResult.token });
    secondConn.disconnect();
  }
);

// Tinytest.addAsync(
//   'accounts - remove other tokens',
//   function (test, onComplete) {
//     // Test that the `removeOtherTokens` method removes all tokens other
//     // than the caller's token, thereby logging out and closing other
//     // connections.
//     var userId = Accounts.insertUserDoc({}, { username: Random.id() });
//     var stampedTokens = [];
//     var conns = [];

//     _.times(2, function (i) {
//       stampedTokens.push(Accounts._generateStampedLoginToken());
//       Accounts._insertLoginToken(userId, stampedTokens[i]);
//       var conn = DDP.connect(Meteor.absoluteUrl());
//       conn.call('login', { resume: stampedTokens[i].token });
//       test.equal(conn.call('getCurrentLoginToken'),
//                  Accounts._hashLoginToken(stampedTokens[i].token));
//       conns.push(conn);
//     });

//     conns[0].call('removeOtherTokens');
//     simplePoll(
//       function () {
//         var tokens = _.map(conns, function (conn) {
//           return conn.call('getCurrentLoginToken');
//         });
//         return ! tokens[1] &&
//           tokens[0] === Accounts._hashLoginToken(stampedTokens[0].token);
//       },
//       function () { // success
//         _.each(conns, function (conn) {
//           conn.disconnect();
//         });
//         onComplete();
//       },
//       function () { // timed out
//         throw new Error("accounts - remove other tokens timed out");
//       }
//     );
//   }
// );

Tinytest.add(
  'accounts - hook callbacks can access Meteor.userId()',
  function (test) {
    var userId = Accounts.insertUserDoc({}, { username: Random.id() });
    var stampedToken = Accounts._generateStampedLoginToken();
    Accounts._insertLoginToken(userId, stampedToken);

    var validateStopper = Accounts.validateLoginAttempt(function(attempt) {
      test.equal(Meteor.userId(), validateAttemptExpectedUserId, "validateLoginAttempt");
      return true;
    });
    var onLoginStopper = Accounts.onLogin(function(attempt) {
      test.equal(Meteor.userId(), onLoginExpectedUserId, "onLogin");
    });
    var onLoginFailureStopper = Accounts.onLoginFailure(function(attempt) {
      test.equal(Meteor.userId(), onLoginFailureExpectedUserId, "onLoginFailure");
    });

    var conn = DDP.connect(Meteor.absoluteUrl());

    // On a new connection, Meteor.userId() should be null until logged in.
    var validateAttemptExpectedUserId = null;
    var onLoginExpectedUserId = userId;
    conn.call('login', { resume: stampedToken.token });

    // Now that the user is logged in on the connection, Meteor.userId() should
    // return that user.
    validateAttemptExpectedUserId = userId;
    conn.call('login', { resume: stampedToken.token });

    // Trigger onLoginFailure callbacks
    var onLoginFailureExpectedUserId = userId;
    test.throws(function() { conn.call('login', { resume: "bogus" }) }, '403');

    conn.disconnect();
    validateStopper.stop();
    onLoginStopper.stop();
    onLoginFailureStopper.stop();
  }
);
