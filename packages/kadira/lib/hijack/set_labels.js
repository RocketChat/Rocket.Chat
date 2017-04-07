setLabels = function () {
  // name Session.prototype.send
  var originalSend = MeteorX.Session.prototype.send;
  MeteorX.Session.prototype.send = function kadira_Session_send (msg) {
    return originalSend.call(this, msg);
  }

  // name Multiplexer initial adds
  var originalSendAdds = MeteorX.Multiplexer.prototype._sendAdds;
  MeteorX.Multiplexer.prototype._sendAdds = function kadira_Multiplexer_sendAdds (handle) {
    return originalSendAdds.call(this, handle);
  }

  // name MongoConnection insert
  var originalMongoInsert = MeteorX.MongoConnection.prototype._insert;
  MeteorX.MongoConnection.prototype._insert = function kadira_MongoConnection_insert (coll, doc, cb) {
    return originalMongoInsert.call(this, coll, doc, cb);
  }

  // name MongoConnection update
  var originalMongoUpdate = MeteorX.MongoConnection.prototype._update;
  MeteorX.MongoConnection.prototype._update = function kadira_MongoConnection_update (coll, selector, mod, options, cb) {
    return originalMongoUpdate.call(this, coll, selector, mod, options, cb);
  }

  // name MongoConnection remove
  var originalMongoRemove = MeteorX.MongoConnection.prototype._remove;
  MeteorX.MongoConnection.prototype._remove = function kadira_MongoConnection_remove (coll, selector, cb) {
    return originalMongoRemove.call(this, coll, selector, cb);
  }

  // name Pubsub added
  var originalPubsubAdded = MeteorX.Session.prototype.sendAdded;
  MeteorX.Session.prototype.sendAdded = function kadira_Session_sendAdded (coll, id, fields) {
    return originalPubsubAdded.call(this, coll, id, fields);
  }

  // name Pubsub changed
  var originalPubsubChanged = MeteorX.Session.prototype.sendChanged;
  MeteorX.Session.prototype.sendChanged = function kadira_Session_sendChanged (coll, id, fields) {
    return originalPubsubChanged.call(this, coll, id, fields);
  }

  // name Pubsub removed
  var originalPubsubRemoved = MeteorX.Session.prototype.sendRemoved;
  MeteorX.Session.prototype.sendRemoved = function kadira_Session_sendRemoved (coll, id) {
    return originalPubsubRemoved.call(this, coll, id);
  }

  // name MongoCursor forEach
  var originalCursorForEach = MeteorX.MongoCursor.prototype.forEach;
  MeteorX.MongoCursor.prototype.forEach = function kadira_Cursor_forEach () {
    return originalCursorForEach.apply(this, arguments);
  }

  // name MongoCursor map
  var originalCursorMap = MeteorX.MongoCursor.prototype.map;
  MeteorX.MongoCursor.prototype.map = function kadira_Cursor_map () {
    return originalCursorMap.apply(this, arguments);
  }

  // name MongoCursor fetch
  var originalCursorFetch = MeteorX.MongoCursor.prototype.fetch;
  MeteorX.MongoCursor.prototype.fetch = function kadira_Cursor_fetch () {
    return originalCursorFetch.apply(this, arguments);
  }

  // name MongoCursor count
  var originalCursorCount = MeteorX.MongoCursor.prototype.count;
  MeteorX.MongoCursor.prototype.count = function kadira_Cursor_count () {
    return originalCursorCount.apply(this, arguments);
  }

  // name MongoCursor observeChanges
  var originalCursorObserveChanges = MeteorX.MongoCursor.prototype.observeChanges;
  MeteorX.MongoCursor.prototype.observeChanges = function kadira_Cursor_observeChanges () {
    return originalCursorObserveChanges.apply(this, arguments);
  }

  // name MongoCursor observe
  var originalCursorObserve = MeteorX.MongoCursor.prototype.observe;
  MeteorX.MongoCursor.prototype.observe = function kadira_Cursor_observe () {
    return originalCursorObserve.apply(this, arguments);
  }

  // name MongoCursor rewind
  var originalCursorRewind = MeteorX.MongoCursor.prototype.rewind;
  MeteorX.MongoCursor.prototype.rewind = function kadira_Cursor_rewind () {
    return originalCursorRewind.apply(this, arguments);
  }

  // name CrossBar listen
  var originalCrossbarListen = DDPServer._Crossbar.prototype.listen;
  DDPServer._Crossbar.prototype.listen = function kadira_Crossbar_listen (trigger, callback) {
    return originalCrossbarListen.call(this, trigger, callback);
  }

  // name CrossBar fire
  var originalCrossbarFire = DDPServer._Crossbar.prototype.fire;
  DDPServer._Crossbar.prototype.fire = function kadira_Crossbar_fire (notification) {
    return originalCrossbarFire.call(this, notification);
  }
}
