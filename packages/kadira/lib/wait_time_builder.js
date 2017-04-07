var WAITON_MESSAGE_FIELDS = ['msg', 'id', 'method', 'name', 'waitTime'];

// This is way how we can build waitTime and it's breakdown
WaitTimeBuilder = function() {
  this._waitListStore = {};
  this._currentProcessingMessages = {};
  this._messageCache = {};
};

WaitTimeBuilder.prototype.register = function(session, msgId) {
  var self = this;
  var mainKey = self._getMessageKey(session.id, msgId);

  var inQueue = session.inQueue || [];
  if(typeof inQueue.toArray === 'function') {
    // latest version of Meteor uses a double-ended-queue for the inQueue
    // info: https://www.npmjs.com/package/double-ended-queue
    inQueue = inQueue.toArray();
  }

  var waitList = inQueue.map(function(msg) {
    var key = self._getMessageKey(session.id, msg.id);
    return self._getCacheMessage(key, msg);
  });

  waitList = waitList || [];

  //add currently processing ddp message if exists
  var currentlyProcessingMessage = this._currentProcessingMessages[session.id];
  if(currentlyProcessingMessage) {
    var key = self._getMessageKey(session.id, currentlyProcessingMessage.id);
    waitList.unshift(this._getCacheMessage(key, currentlyProcessingMessage));
  }

  this._waitListStore[mainKey] = waitList;
};

WaitTimeBuilder.prototype.build = function(session, msgId) {
  var mainKey = this._getMessageKey(session.id, msgId);
  var waitList = this._waitListStore[mainKey] || [];
  delete this._waitListStore[mainKey];

  var filteredWaitList =  waitList.map(this._cleanCacheMessage.bind(this));
  return filteredWaitList;
};

WaitTimeBuilder.prototype._getMessageKey = function(sessionId, msgId) {
  return sessionId + "::" + msgId;
};

WaitTimeBuilder.prototype._getCacheMessage = function(key, msg) {
  var self = this;
  var cachedMessage = self._messageCache[key];
  if(!cachedMessage) {
    self._messageCache[key] = cachedMessage = _.pick(msg, WAITON_MESSAGE_FIELDS);
    cachedMessage._key = key;
    cachedMessage._registered = 1;
  } else {
    cachedMessage._registered++;
  }

  return cachedMessage;
};

WaitTimeBuilder.prototype._cleanCacheMessage = function(msg) {
  msg._registered--;
  if(msg._registered == 0) {
    delete this._messageCache[msg._key];
  }

  // need to send a clean set of objects
  // otherwise register can go with this
  return _.pick(msg, WAITON_MESSAGE_FIELDS);
};

WaitTimeBuilder.prototype.trackWaitTime = function(session, msg, unblock) {
  var self = this;
  var started = Date.now();
  self._currentProcessingMessages[session.id] = msg;

  var unblocked = false;
  var wrappedUnblock = function() {
    if(!unblocked) {
      var waitTime = Date.now() - started;
      var key = self._getMessageKey(session.id, msg.id);
      var cachedMessage = self._messageCache[key];
      if(cachedMessage) {
        cachedMessage.waitTime = waitTime;
      }
      delete self._currentProcessingMessages[session.id];
      unblocked = true;
      unblock();
    }
  };

  return wrappedUnblock;
};