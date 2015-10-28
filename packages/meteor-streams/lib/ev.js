function _EV() {
  var self = this;
  var handlers = {};

  self.emit = function emit(event) {
    var args = Array.prototype.slice.call(arguments, 1);

    if(handlers[event]) {
      for(var lc=0; lc<handlers[event].length; lc++) {
        var handler = handlers[event][lc];
        handler.apply(this, args);
      }
    }
  };

  self.on = function on(event, callback) {
    if(!handlers[event]) {
      handlers[event] = [];
    }
    handlers[event].push(callback);
  };

  self.once = function once(event, callback) {
    self.on(event, function onetimeCallback() {
      callback.apply(this, arguments);
      self.removeListener(event, onetimeCallback);
    });
  };

  self.removeListener = function removeListener(event, callback) {
    if(handlers[event]) {
      var index = handlers[event].indexOf(callback);
      if (index > -1)
        handlers[event].splice(index, 1);
    }
  };

  self.removeAllListeners = function removeAllListeners(event) {
    handlers[event] = undefined;
  };
}

EV = _EV;
