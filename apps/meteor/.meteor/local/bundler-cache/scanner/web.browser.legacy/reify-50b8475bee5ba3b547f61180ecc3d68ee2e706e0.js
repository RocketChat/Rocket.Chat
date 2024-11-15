var newPrototype = require('./newPrototype');
var setPrototypeOf = require('./setPrototypeOf');
var defineProperty = require('./defineProperty');

//just replace the ctor.super to superCtor,
module.exports = function(ctor, superCtor, staticInherit) {
  defineProperty(ctor, 'super_', superCtor);
  defineProperty(ctor, '__super__', superCtor.prototype);//for coffeeScript super keyword.
  var vPrototype = newPrototype(superCtor, ctor);
  ctor.prototype = vPrototype; // ES6 class can not modify prototype!
  if (vPrototype !== ctor.prototype) {
    defineProperty(ctor.prototype, 'constructor', vPrototype.constructor)
    defineProperty(ctor.prototype, 'Class', vPrototype.Class)
  }
  // console.log('TCL:: ~ file: inheritsDirectly.js ~ line 11 ~ ctor.prototype', ctor.prototype, ctor.prototype.constructor, ctor.prototype.Class);
  setPrototypeOf(ctor.prototype, superCtor.prototype);
  if (staticInherit !== false) {
    // NOTE: ES6 use this to keep superCtor.
    setPrototypeOf(ctor, superCtor); // additional static inheritance
  }
};
