function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

module.exportDefault(function() {
  return this.each(remove);
});
