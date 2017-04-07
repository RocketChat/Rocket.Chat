
Tinytest.add(
  'Errors - enableErrorTracking',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    test.equal(Kadira.options.enableErrorTracking, true);
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Errors - disableErrorTracking',
  function (test) {
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.disableErrorTracking();
    test.equal(Kadira.options.enableErrorTracking, false);
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Errors - Custom Errors - simple',
  function (test) {
    var originalTrackError = Kadira.models.error.trackError;
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.models.error.trackError = function (err, trace) {
      test.equal(err, {message: 'msg', stack: ''});
      delete trace.at;
      test.equal(trace, {
        type: 'type',
        subType: 'server',
        name: 'msg',
        errored: true,
        // at: 123,
        events: [
          ['start', 0, {}],
          ['error', 0, {error: {message: 'msg', stack: ''}}]
        ],
        metrics: {total: 0}
      });
    }
    Kadira.trackError('type', 'msg');
    Kadira.models.error.trackError = originalTrackError;
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

Tinytest.add(
  'Errors - Custom Errors - with all values',
  function (test) {
    var originalTrackError = Kadira.models.error.trackError;
    var originalErrorTrackingStatus = Kadira.options.enableErrorTracking;
    Kadira.enableErrorTracking();
    Kadira.models.error.trackError = function (err, trace) {
      test.equal(err, {message: 'msg', stack: 's'});
      delete trace.at;
      test.equal(trace, {
        type: 'type',
        subType: 'st',
        name: 'msg',
        errored: true,
        // at: 123,
        events: [
          ['start', 0, {}],
          ['error', 0, {error: {message: 'msg', stack: 's'}}]
        ],
        metrics: {total: 0}
      });
    }
    Kadira.trackError('type', 'msg', {subType: 'st', stacks: 's'});
    Kadira.models.error.trackError = originalTrackError;
    _resetErrorTracking(originalErrorTrackingStatus);
  }
);

function _resetErrorTracking (status) {
  if(status) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }
}
