module.export({default:()=>chain});let _;module.link('./underscore.js',{default(v){_=v}},0);

// Start chaining a wrapped Underscore object.
function chain(obj) {
  var instance = _(obj);
  instance._chain = true;
  return instance;
}
