var getPrototypeOf     = require('./getPrototypeOf');

module.exports = function(ctor, superStr, throwError) {
  if (ctor.name === superStr) {
    if (throwError)
      throw new Error('Circular inherits found!');
    else
      return true;
  }
  var ctorSuper = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
  var result  =  ctorSuper != null && ctorSuper.name === superStr;
  var checkeds = [];
  checkeds.push(ctor);
  while (!result && ((ctor = ctorSuper) != null)) {
    ctorSuper = (ctor.hasOwnProperty('super_') && ctor.super_) || getPrototypeOf(ctor);
    if (checkeds.indexOf(ctor) >= 0) {
      if (throwError)
        throw new Error('Circular inherits found!');
      else
        return true;
    }
    checkeds.push(ctor);
    result = ctorSuper != null && ctorSuper.name === superStr;
  }
  if (result) {
    result = ctor;
    ctor = checkeds[0];
    if (ctor.mixinCtor_ === result) result = ctor;
  }

  return result;
};
