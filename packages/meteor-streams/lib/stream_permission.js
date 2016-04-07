Meteor.Stream.Permission = function (acceptAll, cacheAll) {
  var options = {
    "read": {
      results: {}
    }, 
    "write": {
      results: {}
    }
  };

  this.clearCache = function(subscriptionId, args) {
    var eventName = args[0];
    delete options['read'].results[subscriptionId + '-' + eventName];
  };

  this.read = function(func, cache) {
    options['read']['func'] = func;
    options['read']['doCache'] = (cache === undefined)? cacheAll: cache; 
  };

  this.write = function(func, cache) {
    options['write']['func'] = func;
    options['write']['doCache'] = (cache === undefined)? cacheAll: cache; 
  };

  this.checkPermission = function(type, subscriptionId, userId, args) {
    var eventName = args[0];
    var namespace = subscriptionId + '-' + eventName;
    var result = options[type].results[namespace];
    
    if(result === undefined) {
      var func = options[type].func;
      if(func) {
        var context = {subscriptionId: subscriptionId, userId: userId};
        result = func.apply(context, args);
        if(options[type].doCache) {
          options[type].results[namespace] = result;
        }
        return result;
      } else {
        return acceptAll;
      }
    } else {
      return result;
    }
  };  
}
