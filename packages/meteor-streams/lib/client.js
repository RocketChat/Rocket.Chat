Meteor.Stream = function Stream(name, callback) {
  EV.call(this);
  
  var self = this;
  var streamName = 'stream-' + name;
  var collection = new Meteor.Collection(streamName);
  var subscription;
  var subscriptionId;

  var connected = false;
  var pendingEvents = [];

  self._emit = self.emit;
  self._on = self.on;

  self.on = function on() {
    self._on.apply(this, arguments);
    var context = { subscriptionId: subscriptionId };
    self.emit.call(context, 'clear', arguments);
  };

  collection.find({}).observe({
    "added": function(item) {
      if(item.type == 'subscriptionId') {
        subscriptionId = item._id;
        connected = true;
        pendingEvents.forEach(function(args) {
          self.emit.apply(self, args);
        });
        pendingEvents = [];
      } else {
        var context = {};
        context.subscriptionId = item.subscriptionId;
        context.userId = item.userId;
        self._emit.apply(context, item.args);    
      }
    }
  });

  subscription = Meteor.subscribe(streamName, callback);

  self.emit = function emit() {
    if(connected) {
      Meteor.call(streamName, subscriptionId, arguments);
    } else {
      pendingEvents.push(arguments);
    }
  };

  self.close = function close() {
    subscription.stop();
  };
}

_.extend(Meteor.Stream.prototype, EV.prototype);
