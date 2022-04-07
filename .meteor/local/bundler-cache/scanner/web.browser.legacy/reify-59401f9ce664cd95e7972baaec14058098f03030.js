function Postis(options) {
  var scope = options.scope;
  var targetWindow = options.window;
  var windowForEventListening = options.windowForEventListening || window;
  var listeners = {};
  var sendBuffer = [];
  var listenBuffer = {};
  var ready = false;
  var readyMethod = "__ready__";
  var readynessCheck;

  var listener = function(event) {
    var data;
    try {
      data = JSON.parse(event.data);
    } catch (e) {
      return;
    }

    if (data.postis && data.scope === scope) {
      var listenersForMethod = listeners[data.method];
      if (listenersForMethod) {
        for (var i = 0; i < listenersForMethod.length; i++) {
          listenersForMethod[i].call(null, data.params);
        }
      } else {
        listenBuffer[data.method] = listenBuffer[data.method] || [];
        listenBuffer[data.method].push(data.params);
      }
    }
  };

  windowForEventListening.addEventListener("message", listener, false);

  var postis = {
    listen: function (method, callback) {
      listeners[method] = listeners[method] || [];
      listeners[method].push(callback);

      var listenBufferForMethod = listenBuffer[method];
      if (listenBufferForMethod) {
        var listenersForMethod = listeners[method];
        for (var i = 0; i < listenersForMethod.length; i++) {
          for (var j = 0; j < listenBufferForMethod.length; j++) {
            listenersForMethod[i].call(null, listenBufferForMethod[j]);
          }
        }
      }
      delete listenBuffer[method];
    },

    send: function (opts) {
      var method = opts.method;

      if ((ready || opts.method === readyMethod) && (targetWindow && typeof targetWindow.postMessage === "function")) {
        targetWindow.postMessage(JSON.stringify({
          postis: true,
          scope: scope,
          method: method,
          params: opts.params
        }), "*");
      } else {
        sendBuffer.push(opts);
      }
    },

    ready: function (callback) {
      if (ready) {
        callback();
      } else {
        setTimeout(function () { postis.ready(callback); }, 50);
      }
    },

    destroy: function (callback) {
      clearInterval(readynessCheck);
      ready = false;
      if (windowForEventListening && typeof windowForEventListening.removeEventListener === "function") {
        windowForEventListening.removeEventListener("message", listener);
      }
      callback && callback();
    }
  };

  var readyCheckID = +new Date() + Math.random() + "";

  readynessCheck = setInterval(function () {
    postis.send({
      method: readyMethod,
      params: readyCheckID
    });
  }, 50);

  postis.listen(readyMethod, function (id) {
    if (id === readyCheckID) {
      clearInterval(readynessCheck);
      ready = true;

      for (var i = 0; i < sendBuffer.length; i++) {
        postis.send(sendBuffer[i]);
      }
      sendBuffer = [];
    } else {
      postis.send({
        method: readyMethod,
        params: id
      });
    }
  });

  return postis;
}

module.exports = Postis;
