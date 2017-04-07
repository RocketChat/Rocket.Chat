
Tinytest.addAsync(
  'Client Side - Error Manager - Reporters - window.onerror - with all args',
  TestWithErrorTrackingAsync(function (test, next) {
    hijackKadiraSendErrors(mock_KadiraSendErrors);
    test.equal(typeof window.onerror, 'function');
    var error = new Error('test-error');
    var message = Meteor.uuid();
    window.onerror(message, '_url', 1, 1, error);

    function mock_KadiraSendErrors(error) {
      test.equal('string', typeof error.appId);
      test.equal('object', typeof error.info);
      test.equal(message, error.name);
      test.equal('client', error.type);
      test.equal(true, Array.isArray(JSON.parse(error.stacks)));
      test.equal('number', typeof error.startTime);
      test.equal('window.onerror', error.subType);
      restoreKadiraSendErrors();
      next();
    }
  })
);

Tinytest.addAsync(
  'Client Side - Error Manager - Reporters - window.onerror - without error',
  TestWithErrorTrackingAsync(function (test, next) {
    hijackKadiraSendErrors(mock_KadiraSendErrors);
    test.equal(typeof window.onerror, 'function');
    var message = Meteor.uuid();
    window.onerror(message, '_url', 1, 1);

    function mock_KadiraSendErrors(error) {
      test.equal('string', typeof error.appId);
      test.equal('object', typeof error.info);
      test.equal(message, error.name);
      test.equal('client', error.type);
      test.equal(true, Array.isArray(JSON.parse(error.stacks)));
      test.equal('number', typeof error.startTime);
      test.equal('window.onerror', error.subType);
      restoreKadiraSendErrors();
      next();
    }
  })
);

//--------------------------------------------------------------------------\\

var original_KadiraSendErrors;

function hijackKadiraSendErrors(mock) {
  original_KadiraSendErrors = Kadira.errors.sendError
  Kadira.errors.sendError = mock;
}

function restoreKadiraSendErrors() {
  Kadira.errors.sendError = original_KadiraSendErrors;
}

function TestWithErrorTrackingAsync (testFunction) {
  return function (test, next) {
    var status = Kadira.options.enableErrorTracking;
    var appId = Kadira.options.appId;
    Kadira.options.appId = 'app';
    Kadira.enableErrorTracking();
    testFunction(test, function () {
      Kadira.options.appId = appId;
      status ? Kadira.enableErrorTracking() : Kadira.disableErrorTracking();
      next();
    });
  }
}
