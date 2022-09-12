module.export({default:()=>mixin});let _;module.link('./underscore.js',{default(v){_=v}},0);let each;module.link('./each.js',{default(v){each=v}},1);let functions;module.link('./functions.js',{default(v){functions=v}},2);let push;module.link('./_setup.js',{push(v){push=v}},3);let chainResult;module.link('./_chainResult.js',{default(v){chainResult=v}},4);





// Add your own custom functions to the Underscore object.
function mixin(obj) {
  each(functions(obj), function(name) {
    var func = _[name] = obj[name];
    _.prototype[name] = function() {
      var args = [this._wrapped];
      push.apply(args, arguments);
      return chainResult(this, func.apply(_, args));
    };
  });
  return _;
}
