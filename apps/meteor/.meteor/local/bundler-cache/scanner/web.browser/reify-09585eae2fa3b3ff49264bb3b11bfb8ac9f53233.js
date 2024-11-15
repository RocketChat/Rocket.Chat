let creator;module.link("../creator",{default(v){creator=v}},0);

module.exportDefault(function(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
});
