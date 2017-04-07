var Fiber = Npm.require('fibers');

HaveAsyncCallback = function(args) {
  var lastArg = args[args.length -1];
  return (typeof lastArg) == 'function';
};

UniqueId = function(start) {
  this.id = 0;
}

UniqueId.prototype.get = function() {
  return "" + this.id++;
};

DefaultUniqueId = new UniqueId();

// Optimized version of apply which tries to call as possible as it can
// Then fall back to apply
// This is because, v8 is very slow to invoke apply.
OptimizedApply = function OptimizedApply(context, fn, args) {
  var a = args;
  switch(a.length) {
    case 0:
      return fn.call(context);
    case 1:
      return fn.call(context, a[0]);
    case 2:
      return fn.call(context, a[0], a[1]);
    case 3:
      return fn.call(context, a[0], a[1], a[2]);
    case 4:
      return fn.call(context, a[0], a[1], a[2], a[3]);
    case 5:
      return fn.call(context, a[0], a[1], a[2], a[3], a[4]);
    default:
      return fn.apply(context, a);
  }
}