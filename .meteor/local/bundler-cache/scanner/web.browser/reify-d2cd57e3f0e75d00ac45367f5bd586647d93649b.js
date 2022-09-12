module.export({default:()=>baseCreate});let isObject;module.link('./isObject.js',{default(v){isObject=v}},0);let nativeCreate;module.link('./_setup.js',{nativeCreate(v){nativeCreate=v}},1);


// Create a naked function reference for surrogate-prototype-swapping.
function ctor() {
  return function(){};
}

// An internal function for creating a new object that inherits from another.
function baseCreate(prototype) {
  if (!isObject(prototype)) return {};
  if (nativeCreate) return nativeCreate(prototype);
  var Ctor = ctor();
  Ctor.prototype = prototype;
  var result = new Ctor;
  Ctor.prototype = null;
  return result;
}
