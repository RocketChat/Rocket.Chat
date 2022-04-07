module.export({default:()=>propertyOf});let noop;module.link('./noop.js',{default(v){noop=v}},0);let get;module.link('./get.js',{default(v){get=v}},1);


// Generates a function for a given object that returns a given property.
function propertyOf(obj) {
  if (obj == null) return noop;
  return function(path) {
    return get(obj, path);
  };
}
