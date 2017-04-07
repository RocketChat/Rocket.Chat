Tinytest.add(
  'Helpers - ddp server connection',
  function (test) {
    var methodId = RegisterMethod(function () {
      return 'pong';
    });
    var client = GetMeteorClient();
    var result = client.call(methodId);
    test.equal(result, 'pong');
  }
);
