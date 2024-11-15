if (Meteor.isServer) {
  Meteor.methods({
    getConnectionUserId: function () {
      return this.userId;
    },
    logCurrentUserId: function () {
      return this.userId;
    },
  });
}

if (Meteor.isClient) {
  const loginAsUser1 = (onUser1LoggedIn) => {
    Accounts.createUser({
      username: `testuser1-${Random.id()}`,
      password: `password1-${Random.id()}`
    }, onUser1LoggedIn);
  };

  Tinytest.addAsync('accounts - reconnect auto-login', (test, done) => {
    function disconnectAndReconnect(callback) {
      test.equal(Meteor.status().status, "connected");

      function pollUntilDisconnected() {
        if (Meteor.status().status === "offline") {
          Meteor.reconnect();
          pollUntilReconnected();
        } else {
          Meteor.setTimeout(pollUntilDisconnected, 10);
        }
      }

      function pollUntilReconnected() {
        if (Meteor.status().status === "connected") {
          if (typeof callback === "function") {
            callback();
          }
        } else {
          Meteor.setTimeout(pollUntilReconnected, 10);
        }
      }

      Meteor.disconnect();
      pollUntilDisconnected();
    }

    let onReconnectCalls = 0;
    const reconnectHandler = () => onReconnectCalls++;
    Meteor.connection.onReconnect = reconnectHandler;

    const username2 = `testuser2-${Random.id()}`;
    const password2 = `password2-${Random.id()}`;
    let timeoutHandle;
    let onLoginStopper;

    loginAsUser1((err) => {
      test.isUndefined(err, 'Unexpected error logging in as user1');
      Accounts.createUser({
        username: username2,
        password: password2
      }, onUser2LoggedIn);
    });

    const onUser2LoggedIn = err => {
      test.isUndefined(err, 'Unexpected error logging in as user2');
      onLoginStopper = Accounts.onLogin(onUser2LoggedInAfterReconnect);
      disconnectAndReconnect();
    }

    const onUser2LoggedInAfterReconnect = () => {
      onLoginStopper.stop();
      Meteor.loginWithPassword('non-existent-user', 'or-wrong-password',
        onFailedLogin);
    }

    const onFailedLogin = err => {
      test.instanceOf(err, Meteor.Error, 'No Meteor.Error on login failure');
      onLoginStopper = Accounts.onLogin(onUser2LoggedInAfterReconnectAfterFailedLogin);
      disconnectAndReconnect();
      timeoutHandle = Meteor.setTimeout(failTest, 5000);
    }

    const failTest = () => {
      onLoginStopper.stop();
      test.fail('Issue #4970 has occured.');
      Meteor.call('getConnectionUserId', checkFinalState);
    }

    const onUser2LoggedInAfterReconnectAfterFailedLogin = () => {
      onLoginStopper.stop();
      Meteor.clearTimeout(timeoutHandle);
      Meteor.call('getConnectionUserId', checkFinalState);
    }

    const checkFinalState = (err, connectionUserId) => {
      test.isUndefined(err, 'Unexpected error calling getConnectionUserId');
      test.equal(connectionUserId, Meteor.userId(),
        'userId is different on client and server');
      test.equal(Meteor.connection.onReconnect, reconnectHandler,
        'Meteor.connection.onReconnect changed');
      test.equal(onReconnectCalls, 2, 'wrong # of reconnect handler calls');
      done();
    }
  });

  // Make sure that when a logged in user is disconnected then reconnected,
  // they still only have one Accounts login onReconnect callback set.
  // Addresses: https://github.com/meteor/meteor/issues/9140
  Tinytest.addAsync(
    'accounts - verify single onReconnect callback',
    (test, done) => {
      loginAsUser1((err) => {
        test.isUndefined(err, 'Unexpected error logging in as user1');
        test.equal(
          Object.keys(DDP._reconnectHook.callbacks).length,
          1,
          'Only one onReconnect callback should be registered'
        );
        Meteor.disconnect();
        test.isFalse(Meteor.status().connected);
        Meteor.reconnect();
        setTimeout(() => {
          test.isTrue(Meteor.status().connected);
          test.equal(
            Object.keys(DDP._reconnectHook.callbacks).length,
            1,
            'Only one onReconnect callback should be registered'
          );
          done();
        }, 1000);
      });
    }
  );
  // Make sure this is issue is fixed: https://forums.meteor.com/t/back-from-offline-method-does-not-apply-on-server-side/61619
  // PR #13221
  Tinytest.addAsync(
    "accounts - user is in the server as soon as we reconnect",
    (test, done) => {
      loginAsUser1(async (err) => {
        test.isUndefined(err, "Unexpected error logging in as user1");
        test.isTrue(Meteor.userId(), "User should be logged in");

        let userId = await Meteor.callAsync("logCurrentUserId");
        test.isTrue(
          userId,
          "userId exists in the server while connecting is up"
        );
        // 1. Disconnect client and server
        Meteor.disconnect();
        test.isFalse(Meteor.status().connected);

        // 2. Invoke a method call after the disconnection
        Meteor.callAsync("logCurrentUserId")
          .then((id) => {
            // 4. the server should still return an id after connection
            test.isTrue(Meteor.status().connected);
            test.isTrue(id, 'userId exists in the server after reconnect');
          })
          .finally(done);

        setTimeout(() => {
          // 3. reconnect the client and server after some time
          Meteor.reconnect();
        }, 1000);
      });
    }
  );
}
