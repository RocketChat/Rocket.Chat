
Tinytest.add(
  'Info - Meteor.EnvironmentVariable',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(testMethod);
    var client = GetMeteorClient();
    var result = client.call(methodId, 10, 'abc');
    CleanTestData();


    function testMethod() {
      Meteor.setTimeout(function () {
        var kadirainfo = Kadira._getInfo(null, true);
        test.equal(!!kadirainfo, true);
      }, 0);
    }
  }
);
