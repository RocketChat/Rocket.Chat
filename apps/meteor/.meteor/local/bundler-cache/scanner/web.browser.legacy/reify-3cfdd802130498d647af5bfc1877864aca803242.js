var isInheritedFromStr = require('./isInheritedFromStr');
var getPrototypeOf     = require('./getPrototypeOf');

var objectSuperCtor = getPrototypeOf(Object);

module.exports = function(ctor, superCtor, throwError) {
  if (typeof superCtor === 'string') return isInheritedFromStr(ctor, superCtor, throwError);
  if (ctor === superCtor) {
    if (throwError)
      throw new Error('Circular inherits found!');
    else
      return true;
  }
  var ctorSuper = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
  var result  = ctorSuper === superCtor;
  var checkeds = [];
  checkeds.push(ctor);
  while (!result && ((ctor = ctorSuper) != null) && ctorSuper !== objectSuperCtor) {
    ctorSuper = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
    if (checkeds.indexOf(ctor) >= 0) {
      if (throwError)
        throw new Error('Circular inherits found!');
      else
        return true;
    }
    checkeds.push(ctor);
    result = ctorSuper === superCtor;
  }
  if (result) {
    result = ctor;
    ctor = checkeds[0];
    if (ctor.mixinCtor_ === result) result = ctor;
  }

  return result;
}
