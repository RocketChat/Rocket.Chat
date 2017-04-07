Tinytest.add(
  'CPU Profiler - set labels - Session.prototype.send',
  function (test) {
    test.equal(MeteorX.Session.prototype.send.name, 'kadira_Session_send');
  }
);

Tinytest.add(
  'CPU Profiler - set labels - MongoCursor methods',
  function (test) {
    var cursorProto = MeteorX.MongoCursor.prototype;
    ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe', 'rewind']
    .forEach(function (name) {
      test.equal(cursorProto[name].name, 'kadira_Cursor_'+name);
    });
  }
);

Tinytest.add(
  'CPU Profiler - set labels - Multiplexer.prototype._sendAdds',
  function (test) {
    var name = MeteorX.Multiplexer.prototype._sendAdds.name;
    test.equal(name, 'kadira_Multiplexer_sendAdds');
  }
);

Tinytest.add(
  'CPU Profiler - set labels - MongoConnection methods',
  function (test) {
    var cursorProto = MeteorX.MongoConnection.prototype;
    ['insert', 'update', 'remove'].forEach(function (name) {
      test.equal(cursorProto['_'+name].name, 'kadira_MongoConnection_'+name);
    });
  }
);

Tinytest.add(
  'CPU Profiler - set labels - Session sends',
  function (test) {
    var sessionProto = MeteorX.Session.prototype;
    ['sendAdded', 'sendChanged', 'sendRemoved'].forEach(function (name) {
      test.equal(sessionProto[name].name, 'kadira_Session_'+name);
    });
  }
);

Tinytest.add(
  'CPU Profiler - set labels - Crossbar methods',
  function (test) {
    var crossbarProto = DDPServer._Crossbar.prototype;
    ['listen', 'fire'].forEach(function (name) {
      test.equal(crossbarProto[name].name, 'kadira_Crossbar_'+name);
    });
  }
);
