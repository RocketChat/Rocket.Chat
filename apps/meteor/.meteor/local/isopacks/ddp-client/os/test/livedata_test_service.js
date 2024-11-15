import has from 'lodash.has';

Meteor.methods({
  nothing: function() {
    // No need to check if there are no arguments.
  },
  echo: function(...args) {
    check(arguments, [Match.Any]);
    return args;
  },
  echoOne: function(/*arguments*/) {
    check(arguments, [Match.Any]);
    return arguments[0];
  },
  exception: function(where, options) {
    check(where, String);
    check(
      options,
      Match.Optional({
        intended: Match.Optional(Boolean),
      })
    );
    options = options || Object.create(null);
    const shouldThrow =
      (Meteor.isServer && where === 'server') ||
      (Meteor.isClient && where === 'client') ||
      where === 'both';

    if (shouldThrow) {
      let e;
      if (options.intended)
        e = new Meteor.Error(999, 'Client-visible test exception');
      else e = new Error('Test method throwing an exception');
      e._expectedByTest = true;

      throw e;
    }
  },
  async setUserId(userId) {
    check(userId, Match.OneOf(String, null));
    await this.setUserId(userId);
  }
});

// Methods to help test applying methods with `wait: true`: delayedTrue returns
// true 1s after being run unless makeDelayedTrueImmediatelyReturnFalse was run
// in the meanwhile. Increasing the timeout makes the "wait: true" test slower;
// decreasing the timeout makes the "wait: false" test flakier (ie, the timeout
// could fire before processing the second method).
if (Meteor.isServer) {
  // Keys are random tokens, used to isolate multiple test invocations from each
  // other.
  const waiters = Object.create(null);

  const returnThroughFuture = function(token, returnValue) {
    // Make sure that when we call return, the fields are already cleared.
    const record = waiters[token];
    if (!record) return;
    delete waiters[token];
    record.future(returnValue);
  };

  Meteor.methods({
    delayedTrue: function(token) {
      check(token, String);

      let resolver;
      const promise = new Promise(res => resolver = res);
      waiters[token] = {
        future: resolver,
        timer: Meteor.setTimeout(function() {
          returnThroughFuture(token, true);
        }, 1000)
      };

      this.unblock();
      return promise;
    },
    makeDelayedTrueImmediatelyReturnFalse: function(token) {
      check(token, String);
      const record = waiters[token];
      if (!record) return; // since delayedTrue's timeout had already run
      clearTimeout(record.timer);
      returnThroughFuture(token, false);
    }
  });
}

/*****/

Ledger = new Mongo.Collection('ledger');
Ledger.allow({
  insertAsync: function() {
    return true;
  },
  updateAsync: function() {
    return true;
  },
  removeAsync: function() {
    return true;
  },
  insert: function() {
    return true;
  },
  update: function() {
    return true;
  },
  remove: function() {
    return true;
  },
  fetch: []
});

Meteor.startup(async function() {
  if (Meteor.isServer) await Ledger.removeAsync({});
});

if (Meteor.isServer)
  Meteor.publish('ledger', function(world) {
    check(world, String);
    return Ledger.find({ world: world });
  });

Meteor.methods({
  'ledger/transfer': async function(world, from_name, to_name, amount, cheat) {
    check(world, String);
    check(from_name, String);
    check(to_name, String);
    check(amount, Number);
    check(cheat, Match.Optional(Boolean));
    const from = await Ledger.findOneAsync({ name: from_name, world: world });
    const to = await Ledger.findOneAsync({ name: to_name, world: world });

    if (Meteor.isServer) cheat = false;

    if (!from)
      throw new Meteor.Error(
        404,
        'No such account ' + from_name + ' in ' + world
      );

    if (!to)
      throw new Meteor.Error(
        404,
        'No such account ' + to_name + ' in ' + world
      );

    if (from.balance < amount && !cheat)
      throw new Meteor.Error(409, 'Insufficient funds');

    await Ledger.updateAsync({_id: from._id}, { $inc: { balance: -amount } });
    await Ledger.updateAsync({_id: to._id, }, { $inc: { balance: amount } });
  }
});

/*****/

/// Helpers for "livedata - changing userid reruns subscriptions..."

objectsWithUsers = new Mongo.Collection('objectsWithUsers');

Meteor.startup(async function() {
  if (Meteor.isServer) {
    await objectsWithUsers.removeAsync({});
    await objectsWithUsers.insertAsync({name: 'owned by none', ownerUserIds: [null]});
    await objectsWithUsers.insertAsync({name: 'owned by one - a', ownerUserIds: ['1']});
    await objectsWithUsers.insertAsync({
      name: 'owned by one/two - a',
      ownerUserIds: ['1', '2']
    });
    await objectsWithUsers.insertAsync({
      name: 'owned by one/two - b',
      ownerUserIds: ['1', '2']
    });
    await objectsWithUsers.insertAsync({name: 'owned by two - a', ownerUserIds: ['2']});
    await objectsWithUsers.insertAsync({name: 'owned by two - b', ownerUserIds: ['2']});

    Meteor.publish('objectsWithUsers', function () {
      return objectsWithUsers.find(
        {ownerUserIds: this.userId},
        {fields: {ownerUserIds: 0}}
      );
    });

    (function () {
      const userIdWhenStopped = Object.create(null);
      Meteor.publish('recordUserIdOnStop', function (key) {
        check(key, String);
        const self = this;
        self.onStop(function () {
          userIdWhenStopped[key] = self.userId;
        });
      });

      Meteor.methods({
        userIdWhenStopped: function (key) {
          check(key, String);
          return userIdWhenStopped[key];
        }
      });
    })();
  }
});
/*****/

/// Helper for "livedata - setUserId fails when called on server"

if (Meteor.isServer) {
  Meteor.startup(async function() {
    errorThrownWhenCallingSetUserIdDirectlyOnServer = null;
    try {
      await Meteor.callAsync('setUserId', '1000');
    } catch (e) {
      errorThrownWhenCallingSetUserIdDirectlyOnServer = e;
    }
  });
}

/// Helper for "livedata - no setUserId after unblock"

if (Meteor.isServer) {
  Meteor.methods({
    async setUserIdAfterUnblock() {
      this.unblock();
      let threw = false;
      const originalUserId = this.userId;
      try {
        // Calling setUserId after unblock should throw an error (and not mutate
        // userId).
        await this.setUserId(originalUserId + 'bla');
      } catch (e) {
        threw = true;
      }
      return threw && this.userId === originalUserId;
    }
  });
}

/*****/

/// Helper for "livedata - overlapping universal subs"

if (Meteor.isServer) {
  (function() {
    const collName = 'overlappingUniversalSubs';
    const universalSubscribers = [[], []];

    [0, 1].forEach(function(index) {
      Meteor.publish(null, function() {
        const sub = this;
        universalSubscribers[index].push(sub);
        sub.onStop(function() {
          universalSubscribers[index] = universalSubscribers[index].filter(function(value) {
            return value !== sub;
          });
        });
      });
    });

    Meteor.methods({
      testOverlappingSubs: function(token) {
        check(token, String);
        universalSubscribers[0].forEach(function(sub) {
          sub.added(collName, token, {});
        });
        universalSubscribers[1].forEach(function(sub) {
          sub.added(collName, token, {});
        });
        universalSubscribers[0].forEach(function(sub) {
          sub.removed(collName, token);
        });
      }
    });
  })();
}

/// Helper for "livedata - runtime universal sub creation"

if (Meteor.isServer) {
  Meteor.methods({
    runtimeUniversalSubCreation: function(token) {
      check(token, String);
      Meteor.publish(null, function() {
        this.added('runtimeSubCreation', token, {});
      });
    }
  });
}

/// Helper for "livedata - publisher errors"

if (Meteor.isServer) {
  Meteor.publish('publisherErrors', function(collName, options) {
    check(collName, String);
    // See below to see what options are accepted.
    check(options, Object);
    const sub = this;

    // First add a random item, which should be cleaned up. We use ready/onReady
    // to make sure that the second test block is only called after the added is
    // processed, so that there's any chance of the coll.find().count() failing.
    sub.added(collName, Random.id(), { foo: 42 });
    sub.ready();

    if (options.stopInHandler) {
      sub.stop();
      return;
    }

    let error;
    if (options.internalError) {
      error = new Error('Egads!');
      error._expectedByTest = true; // don't log
    } else {
      error = new Meteor.Error(412, 'Explicit error');
    }
    if (options.throwInHandler) {
      throw error;
    } else if (options.errorInHandler) {
      sub.error(error);
    } else if (options.throwWhenUserIdSet) {
      if (sub.userId) throw error;
    } else if (options.errorLater) {
      Meteor.defer(function() {
        sub.error(error);
      });
    }
  });
}

/*****/

/// Helpers for "livedata - publish multiple cursors"
One = new Mongo.Collection('collectionOne');
Two = new Mongo.Collection('collectionTwo');

Meteor.startup(async () => {
  if (Meteor.isServer) {
    await One.removeAsync({});
    await One.insertAsync({ name: 'value1' });
    await One.insertAsync({ name: 'value2' });

    await Two.removeAsync({});
    await Two.insertAsync({ name: 'value3' });
    await Two.insertAsync({ name: 'value4' });
    await Two.insertAsync({ name: 'value5' });

    Meteor.publish('multiPublish', function(options) {
      // See below to see what options are accepted.
      check(options, Object);
      if (options.normal) {
        return [One.find(), Two.find()];
      } else if (options.dup) {
        // Suppress the log of the expected internal error.
        Meteor._suppress_log(1);
        return [
          One.find(),
          One.find({ name: 'value2' }), // multiple cursors for one collection - error
          Two.find(),
        ];
      } else if (options.notCursor) {
        // Suppress the log of the expected internal error.
        Meteor._suppress_log(1);
        return [One.find(), 'not a cursor', Two.find()];
      } else throw 'unexpected options';
    });
  }
});

/// Helper for "livedata - result by value"
const resultByValueArrays = Object.create(null);
Meteor.methods({
  getArray: function(testId) {
    if (!has(resultByValueArrays, testId)) resultByValueArrays[testId] = [];
    return resultByValueArrays[testId];
  },
  pushToArray: function(testId, value) {
    if (!has(resultByValueArrays, testId)) resultByValueArrays[testId] = [];
    resultByValueArrays[testId].push(value);
  }
});
/// Helper for "livedata - isAsync call"
Meteor.methods({
  isCallAsync: function () {
    return Meteor.isAsyncCall()
  }
})
