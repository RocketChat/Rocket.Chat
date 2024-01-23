Group = function(router, options) {
  options = options || {};
  this.prefix = options.prefix || '';
  this.options = options;
  this._router = router;
};

Group.prototype.route = function(pathDef, options) {
  pathDef = this.prefix + pathDef;
  return this._router.route(pathDef, options);
};

Group.prototype.group = function(options) {
  var group = new Group(this._router, options);
  group.parent = this;

  return group;
};
