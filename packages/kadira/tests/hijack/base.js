
Tinytest.add(
  'Base - method params',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      TestData.insert({aa: 10});
    });
    var client = GetMeteorClient();
    var result = client.call(methodId, 10, 'abc');
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',, {userId: null, params: '[10,"abc"]'}],
      ['wait',, {waitOn: []}],
      ['db',, {coll: 'tinytest-data', func: 'insert'}],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);
