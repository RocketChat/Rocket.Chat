let sparse;module.link("./sparse",{default(v){sparse=v}},0);let Selection;module.link("./index",{Selection(v){Selection=v}},1);


module.exportDefault(function() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
});
