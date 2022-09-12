module.export({default:()=>chainResult});let _;module.link('./underscore.js',{default(v){_=v}},0);

// Helper function to continue chaining intermediate results.
function chainResult(instance, obj) {
  return instance._chain ? _(obj).chain() : obj;
}
