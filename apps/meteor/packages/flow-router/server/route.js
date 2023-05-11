Route = function(router, pathDef, options) {
  options = options || {};
  this.options = options;
  this.name = options.name;
  this.pathDef = pathDef;

  // Route.path is deprecated and will be removed in 3.0
  this.path = pathDef;

  this.action = options.action || Function.prototype;
  this.subscriptions = options.subscriptions || Function.prototype;
  this._subsMap = {};
};


Route.prototype.register = function(name, sub, options) {
  this._subsMap[name] = sub;
};


Route.prototype.subscription = function(name) {
  return this._subsMap[name];
};


Route.prototype.middleware = function(middleware) {
 
};
