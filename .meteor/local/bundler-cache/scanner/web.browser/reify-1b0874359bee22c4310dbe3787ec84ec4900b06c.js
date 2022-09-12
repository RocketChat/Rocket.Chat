module.export({default:()=>compact});let filter;module.link('./filter.js',{default(v){filter=v}},0);

// Trim out all falsy values from an array.
function compact(array) {
  return filter(array, Boolean);
}
