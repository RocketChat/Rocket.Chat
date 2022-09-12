let _;module.link('./underscore.js',{default(v){_=v}},0);let each;module.link('./each.js',{default(v){each=v}},1);let ArrayProto;module.link('./_setup.js',{ArrayProto(v){ArrayProto=v}},2);let chainResult;module.link('./_chainResult.js',{default(v){chainResult=v}},3);




// Add all mutator `Array` functions to the wrapper.
each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
  var method = ArrayProto[name];
  _.prototype[name] = function() {
    var obj = this._wrapped;
    if (obj != null) {
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) {
        delete obj[0];
      }
    }
    return chainResult(this, obj);
  };
});

// Add all accessor `Array` functions to the wrapper.
each(['concat', 'join', 'slice'], function(name) {
  var method = ArrayProto[name];
  _.prototype[name] = function() {
    var obj = this._wrapped;
    if (obj != null) obj = method.apply(obj, arguments);
    return chainResult(this, obj);
  };
});

module.exportDefault(_);
