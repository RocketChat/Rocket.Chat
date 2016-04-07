var EventEmitter = Npm.require('events').EventEmitter;
var util = Npm.require('util');
var Fibers = Npm.require('fibers');

Meteor.Stream = function Stream(name) {
  EV.call(this);

  var self = this;
  var streamName = 'stream-' + name;
  var allowFunction;
  var allowResultCache = true;
  var allowResults = {};
  var filters = [];

  self.name = name;

  var events = new EventEmitter();
  events.setMaxListeners(0);

  var disconnectEvents = new EV();

  self._emit = self.emit;
  self.emit = function emit() {
    self.emitToSubscriptions(arguments, null, null);
  };

  var defaultResult =  (typeof(Package) == 'object' && Package.insecure)? true: Meteor.Collection.insecure === true;
  self.permissions = new Meteor.Stream.Permission(defaultResult, true);

  self.addFilter = function addFilter(callback) {
    filters.push(callback);
  };
  
  self.emitToSubscriptions = function emitToSubscriptions(args, subscriptionId, userId) {
    events.emit('item', {args: args, userId: userId, subscriptionId: subscriptionId});
  };

  Meteor.publish(streamName, function() {
    check(arguments, Match.Any);
    var subscriptionId = Random.id();
    var publication = this;

    //send subscription id as the first document
    publication.added(streamName, subscriptionId, {type: 'subscriptionId'});
    publication.ready();
    events.on('item', onItem);

    function onItem(item) {
      Fibers(function() {
        var id = Random.id();
        if(self.permissions.checkPermission('read', subscriptionId, publication.userId, item.args)) {
          //do not send again this to the sender
          if(subscriptionId != item.subscriptionId) {
            publication.added(streamName, id, item);
            publication.removed(streamName, id);
          }
        }
      }).run();
    }

    publication.onStop(function() {
      //trigger related onDisconnect handlers if exists
      Fibers(function() {
        disconnectEvents.emit(subscriptionId);
        disconnectEvents.removeAllListeners(subscriptionId);
      }).run();
      events.removeListener('item', onItem);
    });
  });

  var methods = {};
  methods[streamName] = function(subscriptionId, args) {
    check(arguments, Match.Any);
    //in order to send this to the server callback
    var userId = this.userId;
    Fibers(function() {
      var methodContext = {};
      methodContext.userId = userId;
      methodContext.subscriptionId = subscriptionId;

      if (args[0] === 'clear') {
        return self.permissions.clearCache(subscriptionId, args[1]);
      }

      //in order to send this to the serve callback
      methodContext.allowed = self.permissions.checkPermission('write', subscriptionId, methodContext.userId, args);
      if(methodContext.allowed) {
        //apply filters
        args = applyFilters(args, methodContext);
        self.emitToSubscriptions(args, subscriptionId, methodContext.userId);
        //send to firehose if exists
        if(self.firehose) {
          self.firehose(args, subscriptionId, methodContext.userId);
        }
      }
      //need to send this to server always
      self._emit.apply(methodContext, args);
      
      //register onDisconnect handlers if provided
      if(typeof(methodContext.onDisconnect) == 'function') {
        disconnectEvents.on(subscriptionId, methodContext.onDisconnect)
      }

    }).run();
  };
  Meteor.methods(methods);

  function applyFilters(args, context) {
    var eventName = args.shift();
    filters.forEach(function(filter) {
      args = filter.call(context, eventName, args);
    });
    args.unshift(eventName);
    return args;
  }
};

util.inherits(Meteor.Stream, EV);