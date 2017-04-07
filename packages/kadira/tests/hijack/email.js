
Tinytest.add(
  'Email - success',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      Email.send({from: 'arunoda@meteorhacks.com', to: 'hello@meteor.com'});
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0]);
    var expected = [
      ['start'],
      ['wait'],
      ['email'],
      ['complete']
    ];
    test.equal(events, expected);
    CleanTestData();
  }
);
