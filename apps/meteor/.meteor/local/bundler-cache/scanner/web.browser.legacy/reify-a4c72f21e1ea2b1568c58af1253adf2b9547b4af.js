var getConstructor = require('./getConstructor');
var isEmptyFunction = require('./isEmptyFunction');
var extend = require('./_extend');

module.exports = function (aClass, aConstructor) {
  //Object.create(prototype) only for ES5
  //Object.create(prototype, initProps) only for ES6
  //For Browser not support ES5/6:
  //  var Object = function() { this.constructor = aConstructor; };
  //  Object.prototype = aClass.prototype;
  //  return new Object();
  var ctor = isEmptyFunction(aConstructor) ? getConstructor(aClass) : aConstructor;
  // console.log('TCL:: ~ file: newPrototype.js ~ line 13 ~ ctor', aClass, ctor);
  var result;
  if (Object.create) { //typeof Object.create === 'function'
    result = Object.create(aClass.prototype, {
      Class: {
        value: aConstructor,
        enumerable: false,
        writable: true,
        configurable: true
      },
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  } else {
    var Obj = function obj() {this.constructor = ctor;this.Class = aConstructor;};
    Obj.prototype = aClass.prototype;
    result = new Obj();
  }
  extend(result, aConstructor.prototype);
  // console.log('TCL:: ~ file: newPrototype.js ~ line 36 ~ result', result, aConstructor);
  return result;
};
