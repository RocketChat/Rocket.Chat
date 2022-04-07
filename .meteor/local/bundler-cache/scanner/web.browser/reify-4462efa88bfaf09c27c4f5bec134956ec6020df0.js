module.export({default:()=>clone});let isObject;module.link('./isObject.js',{default(v){isObject=v}},0);let isArray;module.link('./isArray.js',{default(v){isArray=v}},1);let extend;module.link('./extend.js',{default(v){extend=v}},2);



// Create a (shallow-cloned) duplicate of an object.
function clone(obj) {
  if (!isObject(obj)) return obj;
  return isArray(obj) ? obj.slice() : extend({}, obj);
}
