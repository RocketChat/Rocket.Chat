StubStream = function() {
  const self = this;

  self.sent = [];
  self.callbacks = Object.create(null);
};

Object.assign(StubStream.prototype, {
  // Methods from Stream
  on: function(name, callback) {
    const self = this;

    if (!self.callbacks[name]) self.callbacks[name] = [callback];
    else self.callbacks[name].push(callback);
  },

  send: function(data) {
    const self = this;
    self.sent.push(data);
  },

  status: function() {
    return { status: 'connected', fake: true };
  },

  reconnect: function() {
    // no-op
  },

  _lostConnection: function() {
    // no-op
  },

  // Methods for tests
  receive: async function(data) {
    const self = this;

    if (typeof data === 'object') {
      data = EJSON.stringify(data);
    }

    for (const cb of self.callbacks['message']) {
      await cb(data);
    }
  },

  reset: async function() {
    const self = this;
    for (const cb of self.callbacks['reset']) {
      await cb();
    }
  },

  // Provide a tag to detect stub streams.
  // We don't log heartbeat failures on stub streams, for example.
  _isStub: true,
  // useful for testing, where we're sure we don't rely on previous method calls
  // this is an example of one https://github.com/meteor/meteor/blob/918e4e10ac05a28a553a36bb1405914f71302170/packages/ddp-client/test/livedata_connection_tests.js#L200
  _neverQueued: true,
});
