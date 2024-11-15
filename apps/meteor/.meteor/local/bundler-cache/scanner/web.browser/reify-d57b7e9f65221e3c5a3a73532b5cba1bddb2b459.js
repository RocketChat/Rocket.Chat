module.exportDefault(function() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
});
