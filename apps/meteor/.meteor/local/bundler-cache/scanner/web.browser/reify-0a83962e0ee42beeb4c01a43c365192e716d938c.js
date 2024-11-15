function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

module.exportDefault(function() {
  return this.on("end.remove", removeFunction(this._id));
});
