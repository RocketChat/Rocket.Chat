Tinytest.add(
  'WaitTimeBuilder - register and build - clean _messageCache',
  function (test) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: [
        {id: "a"}, {id: "b"}
      ]
    };

    wtb.register(session, 'myid');
    var build = wtb.build(session, 'myid');
    test.equal(build, [{id: "a"}, {id: "b"}]);
    test.equal(wtb._messageCache, {});
    test.equal(wtb._waitListStore, {});
  }
);

Tinytest.add(
  'WaitTimeBuilder - no inQueue',
  function (test) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: null
    };

    wtb.register(session, 'myid');
    var build = wtb.build(session, 'myid');
    test.equal(build, []);
    test.equal(wtb._messageCache, {});
    test.equal(wtb._waitListStore, {});
  }
);

Tinytest.add(
  'WaitTimeBuilder - register and build - cached _messageCache',
  function (test) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: [
        {id: "a"}, {id: "b"}
      ]
    };

    wtb.register(session, 'myid');
    wtb.register(session, 'myid2');
    var build = wtb.build(session, 'myid');
    test.equal(build, [{id: "a"}, {id: "b"}]);
    test.equal(_.keys(wtb._messageCache).length, 2);
    test.equal(_.keys(wtb._waitListStore).length, 1);
  }
);

Tinytest.add(
  'WaitTimeBuilder - register and build - current processing',
  function (test) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: [
        {id: "a"}, {id: "b"}
      ]
    };
    wtb._currentProcessingMessages[session.id] = {id: '01'}

    wtb.register(session, 'myid');
    var build = wtb.build(session, 'myid');

    test.equal(build, [{id: '01'}, {id: "a"}, {id: "b"}]);
    test.equal(wtb._messageCache, {});
    test.equal(wtb._waitListStore, {});
  }
);

Tinytest.addAsync(
  'WaitTimeBuilder - track waitTime - with unblock',
  function (test, done) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: [
        {id: "a"}, {id: "b"}
      ]
    };

    wtb.register(session, 'myid');
    var unblock = wtb.trackWaitTime(session, session.inQueue[0], function() {});
    Meteor.setTimeout(function() {
      unblock();
      var build = wtb.build(session, 'myid');
      test.equal(build[0].waitTime >= 100, true);
      test.equal(wtb._messageCache, {});
      test.equal(wtb._waitListStore, {});
      done();
    }, 200);
  }
);

Tinytest.addAsync(
  'WaitTimeBuilder - track waitTime - without unblock',
  function (test, done) {
    var wtb = new WaitTimeBuilder();
    var session = {
      id: 'session-id',
      inQueue: [
        {id: "a"}, {id: "b"}
      ]
    };

    wtb.register(session, 'myid');
    var unblock = wtb.trackWaitTime(session, session.inQueue[0], function() {});
    Meteor.setTimeout(function() {
      var build = wtb.build(session, 'myid');
      test.equal(build[0].waitTime, undefined);
      test.equal(wtb._messageCache, {});
      test.equal(wtb._waitListStore, {});
      done();
    }, 100);
  }
);
