
Tinytest.add(
  'Database - insert',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.insert({aa: 10});
      return 'insert';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'insert'}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - insert with async callback',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.insert({aa: 10}, function () {
        // body...
      });
      return 'insert';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'insert', async: true}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - throw error and catch',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      try {
        TestData.insert({_id: 'aa'});
        TestData.insert({_id: 'aa', aa: 10});
      } catch (ex) {

      }
      return 'insert';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    if (events && events[3] && events[3][2] && events[3][2].err) {
      events[3][2].err = events[3][2].err.indexOf('E11000') >= 0 ? 'E11000' : null;
    };
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'insert'}],
      ['db',,{coll: 'tinytest-data', func: 'insert', err: 'E11000'}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - update',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa', dd: 10});
    var methodId = RegisterMethod(function () {
      TestData.update({_id: 'aa'}, {$set: {dd: 30}});
      return 'update';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',, {coll: 'tinytest-data', func: 'update', selector: JSON.stringify({_id: 'aa'}), updatedDocs: 1}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - remove',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa', dd: 10});
    var methodId = RegisterMethod(function () {
      TestData.remove({_id: 'aa'});
      return 'remove';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',, {coll: 'tinytest-data', func: 'remove', selector: JSON.stringify({_id: 'aa'}), removedDocs: 1}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - findOne',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa', dd: 10});
    var methodId = RegisterMethod(function () {
      return TestData.findOne({_id: 'aa'});
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: 'aa'})}],
      ['db',,{
        coll: 'tinytest-data',
        func: 'fetch',
        cursor: true,
        selector: JSON.stringify({_id: 'aa'}),
        docsFetched: 1,
        docSize: JSON.stringify({_id: 'aa', dd: 10}).length,
        limit: 1
      }],
      ['complete']
    ];

    test.equal(result, {_id: 'aa', dd: 10});
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - findOne with sort and fields',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa', dd: 10});
    var methodId = RegisterMethod(function () {
      return TestData.findOne({_id: 'aa'}, {
        sort: {dd: -1},
        fields: {dd: 1}
      });
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: 'aa'})}],
      ['db',,{
        coll: 'tinytest-data',
        func: 'fetch',
        cursor: true,
        selector: JSON.stringify({_id: 'aa'}),
        sort: JSON.stringify({dd: -1}),
        fields: JSON.stringify({dd: 1}),
        docsFetched: 1,
        docSize: JSON.stringify({_id: 'aa', dd: 10}).length,
        limit: 1
      }],
      ['complete']
    ];

    test.equal(result, {_id: 'aa', dd: 10});
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - upsert',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.upsert({_id: 'aa'}, {$set: {bb: 20}});
      TestData.upsert({_id: 'aa'}, {$set: {bb: 30}});
      return 'upsert';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'upsert', selector: JSON.stringify({_id: 'aa'}), updatedDocs: 1, insertedId: 'aa'}],
      ['db',,{coll: 'tinytest-data', func: 'upsert', selector: JSON.stringify({_id: 'aa'}), updatedDocs: 1, insertedId: undefined}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - upsert with update',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.update({_id: 'aa'}, {$set: {bb: 20}}, {upsert: true});
      TestData.update({_id: 'aa'}, {$set: {bb: 30}}, {upsert: true});
      return 'upsert';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'upsert', selector: JSON.stringify({_id: 'aa'}), updatedDocs: 1}],
      ['db',,{coll: 'tinytest-data', func: 'upsert', selector: JSON.stringify({_id: 'aa'}), updatedDocs: 1}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - indexes',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData._ensureIndex({aa: 1, bb: 1});
      TestData._dropIndex({aa: 1, bb: 1});
      return 'indexes';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: '_ensureIndex', index: JSON.stringify({aa: 1, bb: 1})}],
      ['db',,{coll: 'tinytest-data', func: '_dropIndex', index: JSON.stringify({aa: 1, bb: 1})}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - count',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({aa: 100});
    TestData.insert({aa: 300});
    var methodId = RegisterMethod(function () {
      return TestData.find().count();
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'count', selector: JSON.stringify({})}],
      ['complete']
    ];
    test.equal(result, 2);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - fetch',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      return TestData.find({_id: {$exists: true}}).fetch();
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'fetch', selector: JSON.stringify({_id: {$exists: true}}), docsFetched: 2, docSize: JSON.stringify({_id: 'aa'}).length*2}],
      ['complete']
    ];
    test.equal(result, [{_id: 'aa'}, {_id: 'bb'}]);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - map',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      return TestData.find({_id: {$exists: true}}).map(function(doc) {
        return doc._id;
      });
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'map', selector: JSON.stringify({_id: {$exists: true}}), docsFetched: 2}],
      ['complete']
    ];
    test.equal(result, ['aa', 'bb']);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - forEach',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var res = [];
      TestData.find({_id: {$exists: true}}).forEach(function(doc) {
         res.push(doc._id);
      });
      return res;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'forEach', selector: JSON.stringify({_id: {$exists: true}})}],
      ['complete']
    ];
    test.equal(result, ['aa', 'bb']);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - forEach:findOne inside',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var res = [];
      TestData.find({_id: {$exists: true}}).forEach(function(doc) {
         res.push(doc._id);
         TestData.findOne();
      });
      return res;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'forEach', selector: JSON.stringify({_id: {$exists: true}})}],
      ['complete']
    ];
    test.equal(result, ['aa', 'bb']);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - observeChanges',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var data = [];
      var handle = TestData.find({}).observeChanges({
        added: function(id, fields) {
          fields._id = id;
          data.push(fields);
        }
      });
      handle.stop();
      return data;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    events[3][2].oplog = false;
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'observeChanges', selector: JSON.stringify({}), oplog: false, noOfCachedDocs: 2, wasMultiplexerReady: false}],
      ['complete']
    ];
    test.equal(result, [{_id: 'aa'}, {_id: 'bb'}]);
    clearAdditionalObserverInfo(events[3][2])
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - observeChanges:re-using-multiflexer',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var data = [];
      var handle = TestData.find({}).observeChanges({
        added: function(id, fields) {
          fields._id = id;
          data.push(fields);
        }
      });
      var handle2 = TestData.find({}).observeChanges({
        added: function(id, fields) {
          // body
        }
      });
      handle.stop();
      handle2.stop();
      return data;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    events[3][2].oplog = false;
    events[5][2].oplog = false;
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'observeChanges', selector: JSON.stringify({}), oplog: false, noOfCachedDocs: 2, wasMultiplexerReady: false}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({})}],
      ['db',,{coll: 'tinytest-data', cursor: true, func: 'observeChanges', selector: JSON.stringify({}), oplog: false, noOfCachedDocs: 2, wasMultiplexerReady: true}],
      ['complete']
    ];
    test.equal(result, [{_id: 'aa'}, {_id: 'bb'}]);
    clearAdditionalObserverInfo(events[3][2]);
    clearAdditionalObserverInfo(events[5][2]);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - observe',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var data = [];
      var handle = TestData.find({}).observe({
        added: function(doc) {
          data.push(doc);
        }
      });
      handle.stop();
      return data;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    events[3][2].oplog = false;
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({})}],
      ['db',,{coll: 'tinytest-data', func: 'observe', cursor: true, selector: JSON.stringify({}), oplog: false, noOfCachedDocs: 2, wasMultiplexerReady: false}],
      ['complete']
    ];

    test.equal(result, [{_id: 'aa'}, {_id: 'bb'}]);
    clearAdditionalObserverInfo(events[3][2]);
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Database - Cursor - rewind',
  function (test) {
    EnableTrackingMethods();
    TestData.insert({_id: 'aa'});
    TestData.insert({_id: 'bb'});
    var methodId = RegisterMethod(function () {
      var curosr = TestData.find({_id: {$exists: true}});
      curosr.fetch();
      curosr.rewind();
      return curosr.fetch();
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['db',,{coll: 'tinytest-data', func: 'find', selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', func: 'fetch', cursor: true, selector: JSON.stringify({_id: {$exists: true}}), docsFetched: 2, docSize: JSON.stringify({_id: 'aa'}).length*2}],
      ['db',,{coll: 'tinytest-data', func: 'rewind', cursor: true, selector: JSON.stringify({_id: {$exists: true}})}],
      ['db',,{coll: 'tinytest-data', func: 'fetch', cursor: true, selector: JSON.stringify({_id: {$exists: true}}), docsFetched: 2, docSize: JSON.stringify({_id: 'aa'}).length*2}],
      ['complete']
    ];
    test.equal(result, [{_id: 'aa'}, {_id: 'bb'}]);
    test.equal(events, expected);
    CleanTestData();
  }
);

function clearAdditionalObserverInfo (info) {
  delete info.queueLength;
  delete info.initialPollingTime;
  delete info.elapsedPollingTime;
}