function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

module.exportDefault(function() {
  return this.each(lower);
});
