// A (possibly faster) way to get the current timestamp as an integer.
module.exportDefault(Date.now || function() {
  return new Date().getTime();
});
