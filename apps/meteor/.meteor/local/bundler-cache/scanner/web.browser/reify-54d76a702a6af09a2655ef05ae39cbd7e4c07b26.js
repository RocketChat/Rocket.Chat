let selection;module.link("d3-selection",{selection(v){selection=v}},0);

var Selection = selection.prototype.constructor;

module.exportDefault(function() {
  return new Selection(this._groups, this._parents);
});
