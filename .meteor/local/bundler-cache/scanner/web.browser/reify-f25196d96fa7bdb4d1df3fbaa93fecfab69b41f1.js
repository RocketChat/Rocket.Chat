module.export({default:()=>pluck});let map;module.link('./map.js',{default(v){map=v}},0);let property;module.link('./property.js',{default(v){property=v}},1);


// Convenience version of a common use case of `_.map`: fetching a property.
function pluck(obj, key) {
  return map(obj, property(key));
}
