Tinytest.add("timesync - tick check - normal tick", function(test) {
  var lastTime = 5000;
  var currentTime = 6000;
  var interval = 1000;
  var tolerance = 1000;

  test.equal(SyncInternals.timeCheck(lastTime, currentTime, interval, tolerance), true);
});

Tinytest.add("timesync - tick check - slightly off", function(test) {
  var lastTime = 5000;
  var currentTime = 6500;
  var interval = 1000;
  var tolerance = 1000;

  test.equal(SyncInternals.timeCheck(lastTime, currentTime, interval, tolerance), true);

  currentTime = 5500;

  test.equal(SyncInternals.timeCheck(lastTime, currentTime, interval, tolerance), true);
});

Tinytest.add("timesync - tick check - big jump", function(test) {
  var lastTime = 5000;
  var currentTime = 0;
  var interval = 1000;
  var tolerance = 1000;

  test.equal(SyncInternals.timeCheck(lastTime, currentTime, interval, tolerance), false);

  currentTime = 10000;

  test.equal(SyncInternals.timeCheck(lastTime, currentTime, interval, tolerance), false);
});

/*
  TODO: add tests for proper dependencies in reactive functions
 */

Tinytest.addAsync("timesync - basic - initial sync", function(test, next) {

  function success() {
    var syncedTime = TimeSync.serverTime();

    // Make sure the time exists
    test.isTrue(syncedTime);

    // Make sure it's close to the current time on the client. This should
    // always be true in PhantomJS tests where client/server are the same
    // machine, although it might fail in development environments, for example
    // when the server and client are different VMs.
    test.isTrue( Math.abs(syncedTime - Date.now()) < 1000 );

    next();
  }

  function fail() {
    test.fail();
    next();
  }

  simplePoll(TimeSync.isSynced, success, fail, 5000, 100);
});

Tinytest.addAsync("timesync - basic - serverTime format", function(test, next) {

  test.isTrue(_.isNumber( TimeSync.serverTime() ));

  test.isTrue(_.isNumber( TimeSync.serverTime(null) ));

  // Accept Date as client time
  test.isTrue(_.isNumber( TimeSync.serverTime(new Date()) ));

  // Accept epoch as client time
  test.isTrue(_.isNumber( TimeSync.serverTime(Date.now()) ));

  next();
});

Tinytest.addAsync("timesync - basic - different sync intervals", function(test, next) {

  var aCount = 0, bCount = 0, cCount = 0;

  var a = Tracker.autorun(function () {
    TimeSync.serverTime(null, 500);
    aCount++;
  });

  var b = Tracker.autorun(function () {
    TimeSync.serverTime();
    bCount++;
  });

  var c = Tracker.autorun(function () {
    TimeSync.serverTime(null, 2000);
    cCount++;
  });

  var testInterval = 5000;

  Meteor.setTimeout(function() {

    test.equal(aCount, 10); // 0, 500, 1000, 1500 ...
    // not going to be 5 since the first tick won't generate this dep
    test.equal(bCount, 6);
    test.equal(cCount, 3); // 0, 2000, 4000

    test.isTrue(SyncInternals.timeTick[500]);
    test.isTrue(SyncInternals.timeTick[1000]);
    test.isTrue(SyncInternals.timeTick[2000]);

    test.equal(Object.keys(SyncInternals.timeTick).length, 3);

    a.stop();
    b.stop();
    c.stop();

    next()
  }, testInterval);

});
