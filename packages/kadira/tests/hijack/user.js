
Tinytest.add(
  'User - not logged in',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.insert({aa: 10});
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
