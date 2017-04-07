
Tinytest.add(
  'Client Side - Error Manager - enableErrorTracking',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    test.equal(Kadira.options.enableErrorTracking, true);
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Client Side - Error Manager - disableErrorTracking',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.disableErrorTracking();
    test.equal(Kadira.options.enableErrorTracking, false);
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Client Side - Error Manager - Custom Errors - simple',
  TestWithErrorTracking(function (test) {
    var originalSendError = Kadira.errors.sendError;
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.errors.sendError = function (error) {
      test.equal(error.name, "msg");
      test.equal(error.type, "type");
      test.equal(error.subType, "client");
      test.equal(typeof error.appId, "string");
      test.equal(typeof error.startTime, "number");
      test.equal(typeof error.info, "object");
      test.equal(JSON.parse(error.stacks)[0].stack, "");
    }
    Kadira.trackError('type', 'msg');
    Kadira.errors.sendError = originalSendError;
    _resetErrorTracking(originalErrorTrackingStatus);
  })
);

Tinytest.add(
  'Client Side - Error Manager - Custom Errors - with all options',
  TestWithErrorTracking(function (test) {
    var originalSendError = Kadira.errors.sendError;
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.errors.sendError = function (error) {
      test.equal(error.name, "msg");
      test.equal(error.type, "type");
      test.equal(error.subType, "st");
      test.equal(typeof error.appId, "string");
      test.equal(typeof error.startTime, "number");
      test.equal(typeof error.info, "object");
      test.equal(JSON.parse(error.stacks)[0].stack, "s");
    }
    Kadira.trackError('type', 'msg', {subType: 'st', stacks: 's'});
    Kadira.errors.sendError = originalSendError;
    _resetErrorTracking(originalErrorTrackingStatus);
  })
);

function TestWithErrorTracking (testFunction) {
  return function (test) {
    var status = Kadira.options.enableErrorTracking;
    var appId = Kadira.options.appId;
    Kadira.options.appId = 'app';
    Kadira.enableErrorTracking();
    testFunction(test);
    Kadira.options.appId = appId;
    status ? Kadira.enableErrorTracking() : Kadira.disableErrorTracking();
  }
}

function _resetErrorTracking (status) {
  if(status) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }
}
