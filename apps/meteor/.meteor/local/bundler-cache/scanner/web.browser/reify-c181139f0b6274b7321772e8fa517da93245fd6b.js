let creator;module.link("../creator",{default(v){creator=v}},0);let selector;module.link("../selector",{default(v){selector=v}},1);


function constantNull() {
  return null;
}

module.exportDefault(function(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
});
