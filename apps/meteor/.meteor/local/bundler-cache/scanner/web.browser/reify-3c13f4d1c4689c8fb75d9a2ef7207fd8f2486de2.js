function empty() {
  return [];
}

module.exportDefault(function(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
});
