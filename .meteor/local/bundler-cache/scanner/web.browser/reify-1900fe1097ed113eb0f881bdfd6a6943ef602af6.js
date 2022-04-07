module.export({constantZero:()=>constantZero});function constantZero() {
  return 0;
}

module.exportDefault(function(x) {
  return function() {
    return x;
  };
});
