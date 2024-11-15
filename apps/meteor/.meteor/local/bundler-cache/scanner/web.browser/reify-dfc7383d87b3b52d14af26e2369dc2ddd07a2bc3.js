function none() {}

module.exportDefault(function(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
});
