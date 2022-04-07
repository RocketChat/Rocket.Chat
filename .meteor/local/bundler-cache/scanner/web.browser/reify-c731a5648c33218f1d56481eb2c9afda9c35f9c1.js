module.exportDefault(function(source, keys) {
  return Array.from(keys, key => source[key]);
});
