var Fiber = Npm.require('fibers');

wrapServer = function(serverProto) {
  var originalHandleConnect = serverProto._handleConnect
  serverProto._handleConnect = function(socket, msg) {
    originalHandleConnect.call(this, socket, msg);
    var session = socket._meteorSession;
    // sometimes it is possible for _meteorSession to be undefined
    // one such reason would be if DDP versions are not matching
    // if then, we should not process it
    if(!session) {
      return;
    }

    Kadira.EventBus.emit('system', 'createSession', msg, socket._meteorSession);

    if(Kadira.connected) {
      Kadira.models.system.handleSessionActivity(msg, socket._meteorSession);
    }
  };
};
