//Write by http://stackoverflow.com/users/1048572/bergi
/*
 * Usage:
 *   var fn = createFunction('yourFuncName', ['arg1', 'arg2'], 'return log(arg1+arg2);', {log:console.log});
 *
 * fn.toString() is :
 * "function yourFuncName(arg1, arg2) {
 *    return log(arg1+arg2);
 *  }"
 * here use a tricky to apply the scope:
 * Function(aArguments, aBody)
 * Function(scopeNames, aFunctionCloureBody).apply(null, scopeValues)
 */
var isArray = Array.isArray;
var isString = function(v){return typeof v === 'string';};
var isObject = function(v){return v && typeof v === 'object';};

module.exports = function(name, args, body, scope, values) {
  if (arguments.length === 1) return Function('function ' + name + '(){}\nreturn ' + name + ';')();
  if (isString(args)) {
    values = scope;
    scope = body;
    body = args;
    args = [];
  } else if (args == null) {
    args = [];
  }
  if (!isArray(scope) || !isArray(values)) {
    if (isObject(scope)) {
      var keys = Object.keys(scope);
      values = keys.map(function(k) { return scope[k]; });
      scope = keys;
    } else {
      values = [];
      scope = [];
    }
  }
  return Function(scope,
    'function ' + name + '(' + args.join(', ') + ') {\n' + body + '\n}\nreturn ' + name + ';').apply(null, values);
};
