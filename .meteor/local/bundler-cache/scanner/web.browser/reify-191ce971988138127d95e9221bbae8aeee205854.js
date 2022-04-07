var isArray           = Array.isArray;
var isInheritedFrom   = require('./isInheritedFrom');
var inheritsDirectly  = require('./inheritsDirectly');
var getPrototypeOf    = require('./getPrototypeOf');

var objectSuperCtor = getPrototypeOf(Object);
/**
 * Inherit the prototype methods from one constructor into another.
 *
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 * @param {boolean} staticInherit whether static inheritance,defaults to true.
 */
function inherits(ctor, superCtor, staticInherit) {
  var v  = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
  var mixinCtor = ctor.mixinCtor_;
  if (mixinCtor && v === mixinCtor) {
    ctor = mixinCtor;
    v = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
  }
  var result = false;
  if (!isInheritedFrom(ctor, superCtor) && !isInheritedFrom(superCtor, ctor)) {
    inheritsDirectly(ctor, superCtor, staticInherit);
    // patch the missing prototype chain if exists ctor.super.
    while (v != null && v !== objectSuperCtor && superCtor !== v) {
      ctor = superCtor;
      superCtor = v;
      inheritsDirectly(ctor, superCtor, staticInherit);
      v = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
    }
    result = true;
  }
  return result;
}

module.exports = function(ctor, superCtors, staticInherit) {
  if (!isArray(superCtors)) return inherits(ctor, superCtors, staticInherit);
  for (var i = superCtors.length - 1; i >= 0; i--) {
    if (!inherits(ctor, superCtors[i], staticInherit)) return false;
  }
  return true;
}
