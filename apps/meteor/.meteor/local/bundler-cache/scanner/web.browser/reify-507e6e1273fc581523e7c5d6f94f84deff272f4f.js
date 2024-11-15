module.export({default:()=>create});let baseCreate;module.link('./_baseCreate.js',{default(v){baseCreate=v}},0);let extendOwn;module.link('./extendOwn.js',{default(v){extendOwn=v}},1);


// Creates an object that inherits from the given prototype object.
// If additional properties are provided then they will be added to the
// created object.
function create(prototype, props) {
  var result = baseCreate(prototype);
  if (props) extendOwn(result, props);
  return result;
}
