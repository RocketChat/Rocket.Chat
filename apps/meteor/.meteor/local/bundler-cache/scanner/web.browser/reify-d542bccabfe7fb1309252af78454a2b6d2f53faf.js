let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let map;module.link('./map.js',{default(v){map=v}},2);let deepGet;module.link('./_deepGet.js',{default(v){deepGet=v}},3);let toPath;module.link('./_toPath.js',{default(v){toPath=v}},4);





// Invoke a method (with arguments) on every item in a collection.
module.exportDefault(restArguments(function(obj, path, args) {
  var contextPath, func;
  if (isFunction(path)) {
    func = path;
  } else {
    path = toPath(path);
    contextPath = path.slice(0, -1);
    path = path[path.length - 1];
  }
  return map(obj, function(context) {
    var method = func;
    if (!method) {
      if (contextPath && contextPath.length) {
        context = deepGet(context, contextPath);
      }
      if (context == null) return void 0;
      method = context[path];
    }
    return method == null ? method : method.apply(context, args);
  });
}));
