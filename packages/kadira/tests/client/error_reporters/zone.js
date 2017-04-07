// Note: I found no good way to test these, since no zones is a weak dependency

// Tinytest.addAsync(
//   'Client Side - Error Manager - Reporters - zone - setTimeout',
//   TestWithErrorTrackingAsync(function (test, next) {
//     hijackKadiraSendErrors(mock_KadiraSendErrors);
//     test.equal(typeof window.onerror, 'function');
//     var message = Meteor.uuid();

//     setTimeout(function (argument) {
//       throw new Error(message);
//     }, 0);

//     setTimeout(function (argument) {
//       test.fail('test didn\'t finish within 2 second');
//       next();
//     }, 1000);

//     function mock_KadiraSendErrors(error) {
//       test.equal('string', typeof error.appId);
//       test.equal('object', typeof error.info);
//       test.equal(message, error.name);
//       test.equal('client', error.type);
//       test.equal(true, Array.isArray(JSON.parse(error.stacks)));
//       test.equal('number', typeof error.startTime);
//       test.equal('zone', error.subType);
//       restoreKadiraSendErrors();
//       next();
//     }
//   })
// );

// //--------------------------------------------------------------------------\\

// var original_KadiraSendErrors = Kadira.errors.sendError;

// function hijackKadiraSendErrors(mock) {
//   Kadira.errors.sendError = mock;
// }

// function restoreKadiraSendErrors() {
//   Kadira.errors.sendError = original_KadiraSendErrors;
// }

// function TestWithErrorTrackingAsync (testFunction) {
//   return function (test, next) {
//     var status = Kadira.options.enableErrorTracking;
//     var appId = Kadira.options.appId;
//     Kadira.options.appId = 'app';
//     Kadira.enableErrorTracking();
//     testFunction(test, function () {
//       Kadira.options.appId = appId;
//       status ? Kadira.enableErrorTracking() : Kadira.disableErrorTracking();
//       next();
//     });
//   }
// }
