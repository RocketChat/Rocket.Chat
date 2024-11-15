let interrupt;module.link("../interrupt",{default(v){interrupt=v}},0);

module.exportDefault(function(name) {
  return this.each(function() {
    interrupt(this, name);
  });
});
