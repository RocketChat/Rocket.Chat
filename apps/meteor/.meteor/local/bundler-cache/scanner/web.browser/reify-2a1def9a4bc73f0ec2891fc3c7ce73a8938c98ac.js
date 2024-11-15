let Selection,root;module.link("./selection/index",{Selection(v){Selection=v},root(v){root=v}},0);

module.exportDefault(function(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
});
