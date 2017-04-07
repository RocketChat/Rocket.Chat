
Tinytest.add(
  'Models - Errors - empty',
  function (test) {
    var model = new ErrorModel('_appId');
    var metrics = model.buildPayload().errors;
    test.isTrue(Array.isArray(metrics));
    test.equal(metrics.length, 0);
  }
);

Tinytest.add(
  'Models - Errors - add errors to model',
  function (test) {
    var model = new ErrorModel('_appId');
    var error = {name: '_name', message: '_message', stack: '_stack'};
    var trace = {type: '_type', subType: '_subType', name: '_name'};
    model.trackError(error, trace);
    var storedMetric = model.errors['_type:_message'];
    var expected = {
      appId: '_appId',
      name: '_message',
      subType: '_subType',
      // startTime: Date.now(),
      type: '_type',
      trace: trace,
      stacks: [{stack: '_stack'}],
      count: 1,
    };
    test.equal(typeof storedMetric.startTime, 'number');
    delete storedMetric.startTime;
    test.equal(storedMetric, expected);
  }
);

Tinytest.add(
  'Models - Errors - add errors to model (trace without subType)',
  function (test) {
    var model = new ErrorModel('_appId');
    var error = {name: '_name', message: '_message', stack: '_stack'};
    var trace = {type: '_type', name: '_name'};
    model.trackError(error, trace);
    var storedMetric = model.errors['_type:_message'];
    var expected = {
      appId: '_appId',
      name: '_message',
      subType: '_name',
      // startTime: Date.now(),
      type: '_type',
      trace: trace,
      stacks: [{stack: '_stack'}],
      count: 1,
    };
    test.equal(typeof storedMetric.startTime, 'number');
    delete storedMetric.startTime;
    test.equal(storedMetric, expected);
  }
);

Tinytest.add(
  'Models - Errors - buildPayload',
  function (test) {
    var model = new ErrorModel('_appId');
    var error = {name: '_name', message: '_message', stack: '_stack'};
    var trace = {type: '_type', subType: '_subType', name: '_name'};
    model.trackError(error, trace);
    var metrics = model.buildPayload().errors;
    test.isTrue(Array.isArray(metrics));
    test.equal(metrics.length, 1);
    var payload = metrics[0];
    var expected = {
      appId: '_appId',
      name: '_message',
      subType: '_subType',
      // startTime: Date.now(),
      type: '_type',
      trace: trace,
      stacks: [{stack: '_stack'}],
      count: 1,
    };
    test.equal(typeof payload.startTime, 'number');
    delete payload.startTime;
    test.equal(payload, expected);
  }
);

Tinytest.add(
  'Models - Errors - clear data after buildPayload',
  function (test) {
    var model = new ErrorModel('_appId');
    var error = {name: '_name', message: '_message', stack: '_stack'};
    var trace = {type: '_type', subType: '_subType', name: '_name'};
    model.trackError(error, trace);
    test.equal(true, !!model.errors['_type:_message']);
    var metrics = model.buildPayload().errors;
    test.equal(false, !!model.errors['_type:_message']);
  }
);

Tinytest.add(
  'Models - Errors - buildPayload with same error message',
  function (test) {
    var model = new ErrorModel('_appId');
    var error = {name: '_name', message: '_message', stack: '_stack'};
    var trace = {type: '_type', subType: '_subType', name: '_name'};
    model.trackError(error, trace);
    model.trackError(error, trace);
    model.trackError(error, trace);
    var metrics = model.buildPayload().errors;
    test.isTrue(Array.isArray(metrics));
    test.equal(metrics.length, 1);
    var payload = metrics[0];
    var expected = {
      appId: '_appId',
      name: '_message',
      subType: '_subType',
      // startTime: Date.now(),
      type: '_type',
      trace: trace,
      stacks: [{stack: '_stack'}],
      count: 3,
    };
    test.equal(typeof payload.startTime, 'number');
    delete payload.startTime;
    test.equal(payload, expected);
  }
);

Tinytest.add(
  'Models - Errors - buildPayload with different error messages',
  function (test) {
    var model = new ErrorModel('_appId');
    [1, 2, 3].forEach(function(n) {
      var error = {name: '_name'+n, message: '_message'+n, stack: '_stack'+n};
      var trace = {type: '_type'+n, subType: '_subType'+n, name: '_name'+n};
      model.trackError(error, trace);
    });

    var metrics = model.buildPayload().errors;
    test.isTrue(Array.isArray(metrics));
    test.equal(metrics.length, 3);

    [1, 2, 3].forEach(function(n) {
      var payload = metrics[n-1];
      var trace = {type: '_type'+n, subType: '_subType'+n, name: '_name'+n};
      var expected = {
        appId: '_appId',
        name: '_message'+n,
        subType: '_subType'+n,
        // startTime: Date.now(),
        type: '_type'+n,
        trace: trace,
        stacks: [{stack: '_stack'+n}],
        count: 1,
      };
      test.equal(typeof payload.startTime, 'number');
      delete payload.startTime;
      test.equal(payload, expected);
    });
  }
);

Tinytest.add(
  'Models - Errors - buildPayload with too much errors',
  function (test) {
    var model = new ErrorModel('_appId');
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(function(n) {
      var error = {name: '_name'+n, message: '_message'+n, stack: '_stack'+n};
      var trace = {type: '_type'+n, subType: '_subType'+n, name: '_name'+n};
      model.trackError(error, trace);
    });

    var metrics = model.buildPayload().errors;
    test.isTrue(Array.isArray(metrics));
    test.equal(metrics.length, 10);

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(function(n) {
      var payload = metrics[n-1];
      var trace = {type: '_type'+n, subType: '_subType'+n, name: '_name'+n};
      var expected = {
        appId: '_appId',
        name: '_message'+n,
        subType: '_subType'+n,
        // startTime: Date.now(),
        type: '_type'+n,
        trace: trace,
        stacks: [{stack: '_stack'+n}],
        count: 1,
      };
      test.equal(typeof payload.startTime, 'number');
      delete payload.startTime;
      test.equal(payload, expected);
    });
  }
);

Tinytest.add(
  'Models - Errors - format Error - with Meteor.Error details',
  function(test) {
    var model = new ErrorModel('_appId');
    var details = Random.id();
    var error = new Meteor.Error("code", "message", details);
    var trace = {};
    var payload = model._formatError(error, trace);

    var hasDetails = payload.stacks[0].stack.indexOf(details);
    test.isTrue(hasDetails >= 0);
  }
);

Tinytest.add(
  'Models - Errors - format Error - with Meteor.Error details, with trace',
  function(test) {
    var model = new ErrorModel('_appId');
    var details = Random.id();
    var error = new Meteor.Error("code", "message", details);
    var traceError = {stack: "oldstack"};
    var trace = {events: [0, 1, [0, 1, {error: traceError}]]};
    var payload = model._formatError(error, trace);

    var hasDetails = traceError.stack.indexOf(details);
    test.isTrue(hasDetails >= 0);
  }
);