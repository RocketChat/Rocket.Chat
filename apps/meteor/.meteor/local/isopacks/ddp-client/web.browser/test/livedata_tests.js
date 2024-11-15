import { DDP } from '../common/namespace.js';
import { Connection } from '../common/livedata_connection.js';

const callWhenSubReady = async (subName, handle, cb = () => {}) => {
  let control = 0;

  while (!handle.ready()) {
    if (!handle.ready()) {
      // Just in case something happens with the subscription, we have this control
      if (control++ === 1000) {
        throw new Error(`Subscribe to ${subName} is taking too long!`);
      }
      await Meteor._sleepForMs(0);
      return;
    }
    await cb();
  }
};

// XXX should check error codes
const failure = function(test, code, reason) {
  return function(error, result) {
    test.equal(result, undefined);
    test.isTrue(error && typeof error === 'object');
    if (error && typeof error === 'object') {
      if (typeof code === 'number') {
        test.instanceOf(error, Meteor.Error);
        code && test.equal(error.error, code);
        reason && test.equal(error.reason, reason);
        // XXX should check that other keys aren't present.. should
        // probably use something like the Matcher we used to have
      } else {
        // for normal Javascript errors
        test.instanceOf(error, Error);
        test.equal(error.message, code);
      }
    }
  };
};

const failureOnStopped = function(test, code, reason) {
  const f = failure(test, code, reason);

  return function(error) {
    if (error) {
      f(error);
    }
  };
};

Tinytest.add('livedata - Meteor.Error', function(test) {
  const error = new Meteor.Error(123, 'kittens', 'puppies');
  test.instanceOf(error, Meteor.Error);
  test.instanceOf(error, Error);
  test.equal(error.error, 123);
  test.equal(error.reason, 'kittens');
  test.equal(error.details, 'puppies');
});

if (Meteor.isServer) {
  Tinytest.add('livedata - version negotiation', function(test) {
    const versionCheck = function(clientVersions, serverVersions, expected) {
      test.equal(
        DDPServer._calculateVersion(clientVersions, serverVersions),
        expected
      );
    };

    versionCheck(['A', 'B', 'C'], ['A', 'B', 'C'], 'A');
    versionCheck(['B', 'C'], ['A', 'B', 'C'], 'B');
    versionCheck(['A', 'B', 'C'], ['B', 'C'], 'B');
    versionCheck(['foo', 'bar', 'baz'], ['A', 'B', 'C'], 'A');
  });
}

Tinytest.add('livedata - methods with colliding names', function(test) {
  const x = Random.id();
  const m = {};
  m[x] = function() {};
  Meteor.methods(m);

  test.throws(function() {
    Meteor.methods(m);
  });
});

Tinytest.add('livedata - non-function method', function(test) {
  const x = Random.id();
  const m = {};
  m[x] = 'kitten';

  test.throws(function() {
    Meteor.methods(m);
  });
});

const echoTest = function(item) {
  return async function(test, expect) {
    if (Meteor.isServer) {
      test.equal(await Meteor.callAsync('echo', item), [item]);
      test.equal(await Meteor.callAsync('echoOne', item), item);
    }
    if (Meteor.isClient) test.equal(Meteor.call('echo', item), undefined);

    test.equal(Meteor.call('echo', item, expect(undefined, [item])), undefined);
    test.equal(
      Meteor.call('echoOne', item, expect(undefined, item)),
      undefined
    );
  };
};

testAsyncMulti('livedata - basic method invocation', [
  // Unknown methods
  async function(test, expect) {
    if (Meteor.isServer) {
      // On server, with no callback, throws exception
      let ret;
      let threw;
      try {
        ret = await Meteor.callAsync('unknown method');
      } catch (e) {
        test.equal(e.error, 404);
        threw = true;
      }
      test.isTrue(threw);
      test.equal(ret, undefined);
    }

    if (Meteor.isClient) {
      // On client, with no callback, just returns undefined
      const ret = Meteor.call('unknown method');
      test.equal(ret, undefined);
    }

    // On either, with a callback, calls the callback and does not throw
    const ret = Meteor.call(
      'unknown method',
      expect(failure(test, 404, "Method 'unknown method' not found"))
    );
    test.equal(ret, undefined);
  },

  async function(test, expect) {
    // make sure 'undefined' is preserved as such, instead of turning
    // into null (JSON does not have 'undefined' so there is special
    // code for this)
    if (Meteor.isServer)
      test.equal(await Meteor.callAsync('nothing'), undefined);
    if (Meteor.isClient) test.equal(Meteor.call('nothing'), undefined);

    test.equal(Meteor.call('nothing', expect(undefined, undefined)), undefined);
  },

  async function(test, expect) {
    if (Meteor.isServer) test.equal(await Meteor.callAsync('echo'), []);
    if (Meteor.isClient) test.equal(Meteor.call('echo'), undefined);

    test.equal(Meteor.call('echo', expect(undefined, [])), undefined);
  },

  echoTest(new Date()),
  echoTest({ d: new Date(), s: 'foobarbaz' }),
  echoTest([new Date(), 'foobarbaz']),
  echoTest(new Mongo.ObjectID()),
  echoTest({ o: new Mongo.ObjectID() }),
  echoTest({ $date: 30 }), // literal
  echoTest({ $literal: { $date: 30 } }),
  echoTest(12),
  echoTest(Infinity),
  echoTest(-Infinity),

  async function(test, expect) {
    if (Meteor.isServer)
      test.equal(await Meteor.callAsync('echo', 12, { x: 13 }), [
        12,
        { x: 13 },
      ]);
    if (Meteor.isClient)
      test.equal(Meteor.call('echo', 12, { x: 13 }), undefined);

    test.equal(
      Meteor.call('echo', 12, { x: 13 }, expect(undefined, [12, { x: 13 }])),
      undefined
    );
  },

  // test that `wait: false` is respected
  function(test, expect) {
    if (Meteor.isClient) {
      // For test isolation
      const token = Random.id();
      Meteor.apply(
        'delayedTrue',
        [token],
        { wait: false },
        expect(function(err, res) {
          test.equal(res, false);
        })
      );
      Meteor.apply('makeDelayedTrueImmediatelyReturnFalse', [token]);
    }
  },

  // test that `wait: true` is respected
  function(test, expect) {
    if (Meteor.isClient) {
      const token = Random.id();
      Meteor.apply(
        'delayedTrue',
        [token],
        { wait: true },
        expect(function(err, res) {
          test.equal(res, true);
        })
      );
      Meteor.apply('makeDelayedTrueImmediatelyReturnFalse', [token]);
    }
  },

  async function(test, expect) {
    // No callback

    if (Meteor.isServer) {
      await test.throwsAsync(async function() {
        await Meteor.call('exception', 'both', {show: true});
      });
      await test.throwsAsync(async function() {
        await Meteor.call('exception', 'server', {show: true});
      });
      // No exception, because no code will run on the client
      test.equal(await Meteor.callAsync('exception', 'client'), undefined);
    }

    if (Meteor.isClient) {
      // The client exception is thrown away because it's in the
      // stub. The server exception is throw away because we didn't
      // give a callback.
      test.equal(Meteor.call('exception', 'both'), undefined);
      test.equal(Meteor.call('exception', 'server'), undefined);
      test.equal(Meteor.call('exception', 'client'), undefined);

      // If we pass throwStubExceptions then we *should* see thrown exceptions
      // on the client
      test.throws(function() {
        Meteor.apply('exception', ['both'], { throwStubExceptions: true });
      });
      test.equal(
        Meteor.apply('exception', ['server'], { throwStubExceptions: true }),
        undefined
      );
      test.throws(function() {
        Meteor.apply('exception', ['client'], { throwStubExceptions: true });
      });
    }

    // With callback

    if (Meteor.isClient) {
      test.equal(
        Meteor.call(
          'exception',
          'both',
          expect(failure(test, 500, 'Internal server error'))
        ),
        undefined
      );
      test.equal(
        Meteor.call(
          'exception',
          'server',
          expect(failure(test, 500, 'Internal server error'))
        ),
        undefined
      );
      test.equal(Meteor.call('exception', 'client'), undefined);
    }

    if (Meteor.isServer) {
      test.equal(
        Meteor.call(
          'exception',
          'both',
          expect(failure(test, 'Test method throwing an exception'))
        ),
        undefined
      );
      test.equal(
        Meteor.call(
          'exception',
          'server',
          expect(failure(test, 'Test method throwing an exception'))
        ),
        undefined
      );
      test.equal(await Meteor.callAsync('exception', 'client'), undefined);
    }
  },
],[
  async function(test, expect) {
    if (Meteor.isServer) {
      let threw = false;
      try {
        await Meteor.callAsync('exception', 'both', { intended: true });
      } catch (e) {
        threw = true;
        test.equal(e.error, 999);
        test.equal(e.reason, 'Client-visible test exception');
      }
      test.isTrue(threw);
      threw = false;
      try {
        await Meteor.callAsync('exception', 'both', {
          intended: true,
        });
      } catch (e) {
        threw = true;
        test.equal(e.error, 999);
        test.equal(e.reason, 'Client-visible test exception');
      }
      test.isTrue(threw);
    }

    if (Meteor.isClient) {
      test.equal(
        Meteor.call(
          'exception',
          'both',
          { intended: true },
          expect(failure(test, 999, 'Client-visible test exception'))
        ),
        undefined
      );
      test.equal(
        Meteor.call(
          'exception',
          'server',
          { intended: true },
          expect(failure(test, 999, 'Client-visible test exception'))
        ),
        undefined
      );
      test.equal(
        Meteor.call(
          'exception',
          'server',
          {
            intended: true,
          },
          expect(failure(test, 999, 'Client-visible test exception'))
        ),
        undefined
      );
    }
  },
]);

const checkBalances = async function(test, a, b) {
  const alice = await Ledger.findOneAsync({
    name: 'alice',
    world: test.runId(),
  });
  const bob = await Ledger.findOneAsync({ name: 'bob', world: test.runId() });

  test.equal(alice.balance, a);
  test.equal(bob.balance, b);
};

const subscribeBeforeRun = async (subName, testId, cb) => {
  if (Meteor.isClient) {
    const handle = Meteor.subscribe(subName, testId);
    await callWhenSubReady(subName, handle);
    handle.stop();
  }
  await cb();
};

// would be nice to have a database-aware test harness of some kind --
// this is a big hack (and XXX pollutes the global test namespace)
testAsyncMulti("livedata - compound methods", [
  async function (test) {
    if (Meteor.isClient) {
      Meteor.subscribe("ledger", test.runId(), () => {});
    }

    await Ledger.insertAsync({
      name: "alice",
      balance: 100,
      world: test.runId(),
    });
    await Ledger.insertAsync({ name: "bob", balance: 50, world: test.runId() });
  },
  async function (test) {
    await Meteor.callAsync("ledger/transfer", test.runId(), "alice", "bob", 10);
    await checkBalances(test, 90, 60);
  },
  async function (test) {
    let promise = Meteor.callAsync(
      "ledger/transfer",
      test.runId(),
      "alice",
      "bob",
      100,
      true
    );

    if (Meteor.isClient) {
      // client can fool itself by cheating, but only until the sync
      // finishes

      // for some reason, this doesn't work without the sleep
      // .stubPromise is undefined.
      // promise does not have a stubPromise property.
      await promise.stubPromise;
      await checkBalances(test, -10, 160);
    }

    await promise.catch((err) => {
      failure(test, 409)(err);
    });


    // Balances are reverted back to pre-stub values.
    await checkBalances(test, 90, 60);
  },
]);

// Replaces the Connection's `_livedata_data` method to push incoming
// messages on a given collection to an array. This can be used to
// verify that the right data is sent on the wire
//
// @param messages {Array} The array to which to append the messages
// @return {Function} A function to call to undo the eavesdropping
const eavesdropOnCollection = function(
  livedata_connection,
  collection_name,
  messages
) {
  const old_livedata_data = livedata_connection._livedata_data.bind(
    livedata_connection
  );

  // Kind of gross since all tests past this one will run with this
  // hook set up. That's probably fine since we only check a specific
  // collection but still...
  //
  // Should we consider having a separate connection per Tinytest or
  // some similar scheme?
  livedata_connection._livedata_data = function(msg) {
    if (msg.collection && msg.collection === collection_name) {
      messages.push(msg);
    }
    old_livedata_data(msg);
  };

  return function() {
    livedata_connection._livedata_data = old_livedata_data;
  };
};

if (Meteor.isClient) {
  testAsyncMulti(
    'livedata - changing userid reruns subscriptions without flapping data on the wire',
    [
      async function(test, expect) {
        const messages = [];
        const undoEavesdrop = eavesdropOnCollection(
          Meteor.connection,
          'objectsWithUsers',
          messages
        );

        // A helper for testing incoming set and unset messages
        // XXX should this be extracted as a general helper together with
        // eavesdropOnCollection?
        const expectMessages = function(
          expectedAddedMessageCount,
          expectedRemovedMessageCount,
          expectedNamesInCollection
        ) {
          let actualAddedMessageCount = 0;
          let actualRemovedMessageCount = 0;
          messages.forEach(function(msg) {
            if (msg.msg === 'added') ++actualAddedMessageCount;
            else if (msg.msg === 'removed') ++actualRemovedMessageCount;
            else test.fail({ unexpected: JSON.stringify(msg) });
          });
          test.equal(actualAddedMessageCount, expectedAddedMessageCount);
          test.equal(actualRemovedMessageCount, expectedRemovedMessageCount);
          expectedNamesInCollection.sort();
          test.equal(
            objectsWithUsers.find({}, { sort: ['name'] }).fetch().map(function(x) {
            return x.name;
          }),
            expectedNamesInCollection
          );
          messages.length = 0; // clear messages without creating a new object
        };

        // make sure we're not already logged in. can happen if accounts
        // tests fail oddly.
        Meteor.apply(
          'setUserId',
          [null],
          { wait: true },
          expect(function() {})
        );

        let afterFirstSetUserId;
        let afterSecondSetUserId;
        let afterThirdSetUserId;

        const handle = Meteor.subscribe('objectsWithUsers');

        // Just make sure the subscription is ready before running the tests
        // As everything now runs async, the tests were running before the data fully came in
        await callWhenSubReady('objectsWithUsers', handle, () => {
          expectMessages(1, 0, ['owned by none']);
          Meteor.apply('setUserId', ['1'], { wait: true }, afterFirstSetUserId);
          afterFirstSetUserId = expect(function() {
            expectMessages(3, 1, [
              'owned by one - a',
              'owned by one/two - a',
              'owned by one/two - b',
            ]);
            Meteor.apply(
              'setUserId',
              ['2'],
              { wait: true },
              afterSecondSetUserId
            );
          });

          afterSecondSetUserId = expect(function() {
            expectMessages(2, 1, [
              'owned by one/two - a',
              'owned by one/two - b',
              'owned by two - a',
              'owned by two - b',
            ]);
            Meteor.apply(
              'setUserId',
              ['2'],
              { wait: true },
              afterThirdSetUserId
            );
          });

          afterThirdSetUserId = expect(function() {
            // Nothing should have been sent since the results of the
            // query are the same ("don't flap data on the wire")
            expectMessages(0, 0, [
              'owned by one/two - a',
              'owned by one/two - b',
              'owned by two - a',
              'owned by two - b',
            ]);
            undoEavesdrop();
          });
        });
      },
      function(test, expect) {
        const key = Random.id();
        Meteor.subscribe('recordUserIdOnStop', key);
        Meteor.apply(
          'setUserId',
          ['100'],
          { wait: true },
          expect(function() {})
        );
        Meteor.apply(
          'setUserId',
          ['101'],
          { wait: true },
          expect(function() {})
        );
        Meteor.call(
          'userIdWhenStopped',
          key,
          expect(function(err, result) {
            test.isFalse(err);
            test.equal(result, '100');
          })
        );
        // clean up
        Meteor.apply(
          'setUserId',
          [null],
          { wait: true },
          expect(function() {})
        );
      },
    ]
  );
}

Tinytest.add('livedata - setUserId error when called from server', function(
  test
) {
  if (Meteor.isServer) {
    test.equal(
      errorThrownWhenCallingSetUserIdDirectlyOnServer.message,
      "Can't call setUserId on a server initiated method call"
    );
  }
});

let pubHandles;
if (Meteor.isServer) {
  pubHandles = {};
}

Meteor.methods({
  'livedata/setup': function(id) {
    check(id, String);
    if (Meteor.isServer) {
      pubHandles[id] = {};
      Meteor.publish('pub1' + id, function() {
        pubHandles[id].pub1 = this;
        this.ready();
      });
      Meteor.publish('pub2' + id, function() {
        pubHandles[id].pub2 = this;
        this.ready();
      });
    }
  },
  'livedata/pub1go': function(id) {
    check(id, String);
    if (Meteor.isServer) {
      pubHandles[id].pub1.added('MultiPubCollection' + id, 'foo', { a: 'aa' });
      return 1;
    }
    return 0;
  },
  'livedata/pub2go': function(id) {
    check(id, String);
    if (Meteor.isServer) {
      pubHandles[id].pub2.added('MultiPubCollection' + id, 'foo', { b: 'bb' });
      return 2;
    }
    return 0;
  },
});

if (Meteor.isClient) {
  (function() {
    let MultiPub;
    const id = Random.id();
    testAsyncMulti('livedata - added from two different subs', [
      function(test, expect) {
        Meteor.call(
          'livedata/setup',
          id,
          expect(function() {})
        );
      },
      function(test, expect) {
        MultiPub = new Mongo.Collection('MultiPubCollection' + id);
        const sub1 = Meteor.subscribe(
          'pub1' + id,
          expect(function() {})
        );
        const sub2 = Meteor.subscribe(
          'pub2' + id,
          expect(function() {})
        );
      },
      function(test, expect) {
        Meteor.call(
          'livedata/pub1go',
          id,
          expect(function(err, res) {
            test.equal(res, 1);
          })
        );
      },
      function(test, expect) {
        test.equal(MultiPub.findOne('foo'), { _id: 'foo', a: 'aa' });
      },
      function(test, expect) {
        Meteor.call(
          'livedata/pub2go',
          id,
          expect(function(err, res) {
            test.equal(res, 2);
          })
        );
      },
      function(test, expect) {
        test.equal(MultiPub.findOne('foo'), { _id: 'foo', a: 'aa', b: 'bb' });
      },
    ]);
  })();
}

if (Meteor.isClient) {
  testAsyncMulti('livedata - overlapping universal subs', [
    function(test, expect) {
      const coll = new Mongo.Collection('overlappingUniversalSubs');
      const token = Random.id();
      test.isFalse(coll.findOne(token));
      Meteor.call(
        'testOverlappingSubs',
        token,
        expect(function(err) {
          test.isFalse(err);
          test.isTrue(coll.findOne(token));
        })
      );
    },
  ]);

  testAsyncMulti('livedata - runtime universal sub creation', [
    function(test, expect) {
      const coll = new Mongo.Collection('runtimeSubCreation');
      const token = Random.id();
      test.isFalse(coll.findOne(token));
      Meteor.call(
        'runtimeUniversalSubCreation',
        token,
        expect(function(err) {
          test.isFalse(err);
          test.isTrue(coll.findOne(token));
        })
      );
    },
  ]);

  testAsyncMulti('livedata - no setUserId after unblock', [
    function(test, expect) {
      Meteor.call(
        'setUserIdAfterUnblock',
        expect(function(err, result) {
          test.isFalse(err);
          test.isTrue(result);
        })
      );
    },
  ]);

  testAsyncMulti(
    'livedata - publisher errors with onError callback',
    (function() {
      let conn, collName, coll;
      let errorFromRerun;
      let gotErrorFromStopper = false;
      return [
        function(test, expect) {
          // Use a separate connection so that we can safely check to see if
          // conn._subscriptions is empty.
          conn = new Connection('/', {
            reloadWithOutstanding: true,
          });
          collName = Random.id();
          coll = new Mongo.Collection(collName, { connection: conn });

          const testSubError = function(options) {
            conn.subscribe('publisherErrors', collName, options, {
              onReady: expect(),
              onError: expect(
                failure(
                  test,
                  options.internalError ? 500 : 412,
                  options.internalError
                    ? 'Internal server error'
                    : 'Explicit error'
                )
              ),
            });
          };
          testSubError({ throwInHandler: true });
          testSubError({ throwInHandler: true, internalError: true });
          testSubError({ errorInHandler: true });
          testSubError({ errorInHandler: true, internalError: true });
          testSubError({ errorLater: true });
          testSubError({ errorLater: true, internalError: true });
        },
        function(test, expect) {
          test.equal(coll.find().count(), 0);
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test

          conn.subscribe(
            'publisherErrors',
            collName,
            { throwWhenUserIdSet: true },
            {
              onReady: expect(),
              onError: function(error) {
                errorFromRerun = error;
              },
            }
          );
        },
        function(test, expect) {
          // Because the last subscription is ready, we should have a document.
          test.equal(coll.find().count(), 1);
          test.isFalse(errorFromRerun);
          test.equal(Object.keys(conn._subscriptions).length, 1); // white-box test
          conn.call(
            'setUserId',
            'bla',
            expect(function() {})
          );
        },
        function(test, expect) {
          // Now that we've re-run, we should have stopped the subscription,
          // gotten a error, and lost the document.
          test.equal(coll.find().count(), 0);
          test.isTrue(errorFromRerun);
          test.instanceOf(errorFromRerun, Meteor.Error);
          test.equal(errorFromRerun.error, 412);
          test.equal(errorFromRerun.reason, 'Explicit error');
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test

          conn.subscribe(
            'publisherErrors',
            collName,
            { stopInHandler: true },
            {
              onError: function() {
                gotErrorFromStopper = true;
              },
              onStop: expect(function () {}),
            }
          );
        },
        function(test, expect) {
          test.equal(coll.find().count(), 0);
          // sub.stop does NOT call onError.
          test.isFalse(gotErrorFromStopper);
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test
          conn._stream.disconnect({ _permanent: true });
        },
      ];
    })()
  );

  testAsyncMulti(
    'livedata - publisher errors with onStop callback',
    (function() {
      let conn, collName, coll;
      let errorFromRerun;
      let gotErrorFromStopper = false;
      return [
        function(test, expect) {
          // Use a separate connection so that we can safely check to see if
          // conn._subscriptions is empty.
          conn = new Connection('/', {
            reloadWithOutstanding: true,
          });
          collName = Random.id();
          coll = new Mongo.Collection(collName, { connection: conn });

          const testSubError = function(options) {
            conn.subscribe('publisherErrors', collName, options, {
              onReady: expect(),
              onStop: expect(
                failureOnStopped(
                  test,
                  options.internalError ? 500 : 412,
                  options.internalError
                    ? 'Internal server error'
                    : 'Explicit error'
                )
              ),
            });
          };
          testSubError({ throwInHandler: true });
          testSubError({ throwInHandler: true, internalError: true });
          testSubError({ errorInHandler: true });
          testSubError({ errorInHandler: true, internalError: true });
          testSubError({ errorLater: true });
          testSubError({ errorLater: true, internalError: true });
        },
        function(test, expect) {
          test.equal(coll.find().count(), 0);
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test

          conn.subscribe(
            'publisherErrors',
            collName,
            { throwWhenUserIdSet: true },
            {
              onReady: expect(),
              onStop: function(error) {
                errorFromRerun = error;
              },
            }
          );
        },
        function(test, expect) {
          // Because the last subscription is ready, we should have a document.
          test.equal(coll.find().count(), 1);
          test.isFalse(errorFromRerun);
          test.equal(Object.keys(conn._subscriptions).length, 1); // white-box test
          conn.call('setUserId', 'bla', expect(function() {}));
        },
        function(test, expect) {
          // Now that we've re-run, we should have stopped the subscription,
          // gotten a error, and lost the document.
          test.equal(coll.find().count(), 0);
          test.isTrue(errorFromRerun);
          test.instanceOf(errorFromRerun, Meteor.Error);
          test.equal(errorFromRerun.error, 412);
          test.equal(errorFromRerun.reason, 'Explicit error');
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test

          const expected = expect();
          conn.subscribe(
            'publisherErrors',
            collName,
            { stopInHandler: true },
            {
              onStop: function(error) {
                if (error) {
                  gotErrorFromStopper = true;
                }
                expected();
              },
            }
          );
        },
        function(test, expect) {
          test.equal(coll.find().count(), 0);
          // sub.stop does NOT call onError.
          test.isFalse(gotErrorFromStopper);
          test.equal(Object.keys(conn._subscriptions).length, 0); // white-box test
          conn._stream.disconnect({ _permanent: true });
        },
      ];
    })()
  );

  testAsyncMulti('livedata - publish multiple cursors', [
    function(test, expect) {
      const sub = Meteor.subscribe(
        'multiPublish',
        { normal: 1 },
        {
          onReady: expect(function() {
            test.isTrue(sub.ready());
            test.equal(One.find().count(), 2);
            test.equal(Two.find().count(), 3);
          }),
          onError: failure(),
        }
      );
    },
    function(test, expect) {
      Meteor.subscribe(
        'multiPublish',
        { dup: 1 },
        {
          onReady: failure(),
          onError: expect(failure(test, 500, 'Internal server error')),
        }
      );
    },
    function(test, expect) {
      Meteor.subscribe(
        'multiPublish',
        { notCursor: 1 },
        {
          onReady: failure(),
          onError: expect(failure(test, 500, 'Internal server error')),
        }
      );
    },
  ]);
}

const selfUrl = Meteor.isServer
  ? Meteor.absoluteUrl()
  : Meteor._relativeToSiteRootUrl('/');

if (Meteor.isServer) {
  Meteor.methods({
    s2s: function(arg) {
      check(arg, String);
      return 's2s ' + arg;
    },
  });
}
(function() {
  testAsyncMulti('livedata - connect works from both client and server', [
    function(test, expect) {
      const self = this;
      self.conn = DDP.connect(selfUrl);
      pollUntil(
        expect,
        function() {
          return self.conn.status().connected;
        },
        10000
      );
    },

    function(test, expect) {
      const self = this;
      if (self.conn.status().connected) {
        self.conn.call(
          's2s',
          'foo',
          expect(function(err, res) {
            if (err) throw err;
            test.equal(res, 's2s foo');
          })
        );
      }
    },
  ]);
})();

if (Meteor.isServer) {
  (function() {
    testAsyncMulti('livedata - method call on server blocks in a fiber way', [
      function(test, expect) {
        const self = this;
        self.conn = DDP.connect(selfUrl);
        pollUntil(
          expect,
          function() {
            return self.conn.status().connected;
          },
          10000
        );
      },

      async function(test, expect) {
        const self = this;
        if (self.conn.status().connected) {
          const callResult = await self.conn.callAsync('s2s', 'foo');
          test.equal(callResult, 's2s foo');
        }
      },
    ]);
  })();
}

(function() {
  testAsyncMulti('livedata - connect fails to unknown place', [
    function(test, expect) {
      const self = this;
      self.conn = DDP.connect('example.com', { _dontPrintErrors: true });
      Meteor.setTimeout(
        expect(function() {
          test.isFalse(self.conn.status().connected, 'Not connected');
          self.conn.close();
        }),
        500
      );
    },
  ]);
})();

if (Meteor.isServer) {
  Meteor.publish('publisherCloning', function() {
    const self = this;
    const fields = { x: { y: 42 } };
    self.added('publisherCloning', 'a', fields);
    fields.x.y = 43;
    self.changed('publisherCloning', 'a', fields);
    self.ready();
  });
} else {
  const PublisherCloningCollection = new Mongo.Collection('publisherCloning');
  testAsyncMulti('livedata - publish callbacks clone', [
    function(test, expect) {
      Meteor.subscribe(
        'publisherCloning',
        { normal: 1 },
        {
          onReady: expect(function() {
            test.equal(PublisherCloningCollection.findOne(), {
              _id: 'a',
              x: { y: 43 },
            });
          }),
          onError: failure(),
        }
      );
    },
  ]);
}

testAsyncMulti('livedata - result by value', [
  function(test, expect) {
    const self = this;
    self.testId = Random.id();
    Meteor.call(
      'getArray',
      self.testId,
      expect(function(error, firstResult) {
        test.isFalse(error);
        test.isTrue(firstResult);
        self.firstResult = firstResult;
      })
    );
  },
  function(test, expect) {
    const self = this;
    Meteor.call(
      'pushToArray',
      self.testId,
      'xxx',
      expect(function(error) {
        test.isFalse(error);
      })
    );
  },
  function(test, expect) {
    const self = this;
    Meteor.call(
      'getArray',
      self.testId,
      expect(function(error, secondResult) {
        test.isFalse(error);
        test.equal(self.firstResult.length + 1, secondResult.length);
      })
    );
  },
]);

testAsyncMulti('livedata - methods with nested stubs', [
  function() {
    const self = this;
    self.collectionName = 'livedata-tests';
    self.coll = new Mongo.Collection(self.collectionName);
    if (Meteor.isServer) {
      Meteor.publish('c' + self.collectionName, () => self.coll.find());
    }

    Meteor.methods({
      async insertData(data) {
        const id = await self.coll.insertAsync(data);
        return [id, `inserted with: ${id}`];
      },
      async updateData(id, data) {
        const beforeUpdateData = await Meteor.callAsync('getData', id);
        const r = await self.coll.updateAsync(
          id,
          { $set: data },
        );
        const afterUpdateData = await Meteor.callAsync('getData', id);
        return [
          r,
          {
            before: `before update: a:${beforeUpdateData.a}`,
            after: `after update: a:${afterUpdateData.a}, gotData:${afterUpdateData.gotData}`,
          },
        ];
      },
      async getData(id) {
        const data = await self.coll.findOneAsync(id);

        await self.coll.updateAsync(id, { $set: { gotData: true } });
        return data;
      },
    });
  },
  function(test, expected) {
    if (Meteor.isClient) {
      const subs = Meteor.subscribe('c' + this.collectionName, () => {});
      let resolver;
      const promise = new Promise(r => (resolver = r));

      const id = setInterval(() => {
        if (subs.ready()) {
          clearInterval(id);
          resolver();
        }
      }, 10);

      return promise;
    }
  },
  async function(test) {
    if (Meteor.isClient) {
      return Meteor.callAsync('insertData', { a: 1 })
        .then(async data => {
          const [id, message] =  data;
          test.equal(message, `inserted with: ${id}`);
          return Meteor.callAsync('updateData', id, { a: 2 });
        })
        .then(async data => {
          const [count, message] = data;
          test.equal(count, 1);
          test.equal(message.before, 'before update: a:1');
          test.equal(message.after, 'after update: a:2, gotData:true');
        });
    }
  },
]);

// TODO [FIBERS] - check if this still makes sense to have

//  Tinytest.addAsync('livedata - isAsync call', async function (test) {
//   Meteor.call('isCallAsync', (err, result) => test.equal(result, false))
//   const result = await Meteor.callAsync('isCallAsync', { returnStubValue: true })
//   test.equal(result, true)
// })

// XXX some things to test in greater detail:
// staying in simulation mode
// time warp
// serialization / beginAsync(true) / beginAsync(false)
// malformed messages (need raw wire access)
// method completion/satisfaction
// subscriptions (multiple APIs, including autorun?)
// subscription completion
// subscription attribute shadowing
// server method calling methods on other server (eg, should simulate)
// subscriptions and methods being idempotent
// reconnection
// reconnection not resulting in method re-execution
// reconnection tolerating all kinds of lost messages (including data)
// [probably lots more]