
Tinytest.add(
  'Async - track with Meteor._wrapAsync',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      var wait = Meteor._wrapAsync(function(waitTime, callback) {
        setTimeout(callback, waitTime);
      });
      wait(100);
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0]);
    var expected = [
      ['start'],
      ['wait'],
      ['async'],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);

Tinytest.add(
  'Async - track with Meteor._wrapAsync with error',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      var wait = Meteor._wrapAsync(function(waitTime, callback) {
        setTimeout(function () {
          callback(new Error('error'));
        }, waitTime);
      });
      try {
        wait(100);
      } catch (ex) {

      }
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0]);
    var expected = [
      ['start'],
      ['wait'],
      ['async'],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);
