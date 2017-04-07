
Tinytest.add(
  'HTTP - call a server',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      var result = HTTP.get('http://localhost:3301');
      return result.statusCode;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['http',,{url: 'http://localhost:3301', method: 'GET', statusCode: 200}],
      ['complete']
    ];
    test.equal(events, expected);
    test.equal(result, 200);
    CleanTestData();
  }
);

Tinytest.add(
  'HTTP - async callback',
  function (test) {
    EnableTrackingMethods();
    var methodId = RegisterMethod(function () {
      var Future = Npm.require('fibers/future');
      var f = new Future();
      var result;
      HTTP.get('http://localhost:3301', function(err, res) {
        result = res;
        f.return();
      });
      f.wait();
      return result.statusCode;
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    var events = GetLastMethodEvents([0, 2]);
    var expected = [
      ['start',,{userId: null, params: '[]'}],
      ['wait',,{waitOn: []}],
      ['http',,{url: 'http://localhost:3301', method: 'GET', async: true}],
      ['async',, {}],
      ['complete']
    ];
    test.equal(events, expected);
    test.equal(result, 200);
    CleanTestData();
  }
);
