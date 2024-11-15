function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

module.exportDefault(function() {
  return this.each(raise);
});
