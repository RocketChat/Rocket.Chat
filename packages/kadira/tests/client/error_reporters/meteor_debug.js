
Tinytest.add(
  'Client Side - Error Manager - Reporters - meteor._debug - with zone',
  TestWithErrorTracking(function (test) {
    hijackKadiraSendErrors(mock_KadiraSendErrors);
    test.equal(typeof Meteor._debug, 'function');
    var errorSent = false;
    var message = Meteor.uuid();

    // set window.zone as nothing
    var originalZone = window.zone;
    window.zone = {};

    Meteor._debug(message, '_stack');
    test.equal(errorSent, false);
    restoreKadiraSendErrors();

    // cleajr 
    window.zone = originalZone;
    function mock_KadiraSendErrors(data) {
      errorSent = true;
    }
  })
);

Tinytest.add(
  'Client Side - Error Manager - Reporters - meteor._debug - without zone',
  TestWithErrorTracking(function (test) {
    hijackKadiraSendErrors(mock_KadiraSendErrors);
    test.equal(typeof Meteor._debug, 'function');
    var errorSent = false;
    var originalZone = window.zone;
    var message = Meteor.uuid();
    window.zone = undefined;

    try {
      Meteor._debug(message, '_stack');
    } catch(e) {};

    window.zone = originalZone;
    test.equal(errorSent, true);
    restoreKadiraSendErrors();

    function mock_KadiraSendErrors(error) {
      errorSent = true;
      test.equal('string', typeof error.appId);
      test.equal('object', typeof error.info);
      test.equal(message, error.name);
      test.equal('client', error.type);
      test.equal(true, Array.isArray(JSON.parse(error.stacks)));
      test.equal('number', typeof error.startTime);
      test.equal('meteor._debug', error.subType);
    }
  })
);

Tinytest.add(
  'Client Side - Error Manager - Reporters - meteor._debug - using Error only',
  TestWithErrorTracking(function (test) {
    hijackKadiraSendErrors(mock_KadiraSendErrors);
    test.equal(typeof Meteor._debug, 'function');
    var errorSent = false;
    var originalZone = window.zone;
    var message = Meteor.uuid();
    window.zone = undefined;

    try {
      var err = new Error(message);
      err.stack = '_stack';
      Meteor._debug(err);
    } catch(e) {};

    window.zone = originalZone;
    test.equal(errorSent, true);
    restoreKadiraSendErrors();

    function mock_KadiraSendErrors(error) {
      errorSent = true;
      test.equal('string', typeof error.appId);
      test.equal('object', typeof error.info);
      test.equal(message, error.name);
      test.equal('client', error.type);
      test.equal(true, Array.isArray(JSON.parse(error.stacks)));
      test.equal('number', typeof error.startTime);
      test.equal('meteor._debug', error.subType);
    }
  })
);

//--------------------------------------------------------------------------\\

var original_KadiraSendErrors;

function hijackKadiraSendErrors(mock) {
  original_KadiraSendErrors = Kadira.errors.sendError;
  Kadira.errors.sendError = mock;
}

function restoreKadiraSendErrors() {
  Kadira.errors.sendError = original_KadiraSendErrors;
}

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
