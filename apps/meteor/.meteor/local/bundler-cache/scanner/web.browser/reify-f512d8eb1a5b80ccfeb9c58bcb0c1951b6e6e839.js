module.exportDefault(function(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
});
