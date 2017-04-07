Kadira = {};
Kadira.options = {};

if(Meteor.wrapAsync) {
  Kadira._wrapAsync = Meteor.wrapAsync;
} else {
  Kadira._wrapAsync = Meteor._wrapAsync;
}

if(Meteor.isServer) {
  var EventEmitter = Npm.require('events').EventEmitter;
  var eventBus = new EventEmitter();
  eventBus.setMaxListeners(0);

  var buildArgs = function(args) {
    args = _.toArray(args);
    var eventName = args[0] + '-' + args[1];
    var args = args.slice(2);
    args.unshift(eventName);
    return args;
  };
  
  Kadira.EventBus = {};
  _.each(['on', 'emit', 'removeListener', 'removeAllListeners'], function(m) {
    Kadira.EventBus[m] = function() {
      var args = buildArgs(arguments);
      return eventBus[m].apply(eventBus, args);
    };
  });
}