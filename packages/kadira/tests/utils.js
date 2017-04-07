Tinytest.addAsync(
  'Utils - OptimizedApply - calling arguments',
  function (test, done) {
    runWithArgs(0);
    function runWithArgs(argCount) {
      var context = {};
      var args = buildArrayOf(argCount);
      var retValue = Random.id();
      var fn = function() {
        test.equal(_.toArray(arguments), args);
        test.equal(this, context);
        return retValue;
      };

      var ret = OptimizedApply(context, fn, args)
      test.equal(ret, retValue);

      if(argCount > 10) {
        done();
      } else {
        runWithArgs(argCount + 1);
      }
    }
  }
);

function buildArrayOf(length) {
  var arr = [];
  for(var lc=0; lc<length; lc++) {
    arr.push(Random.id());
  }
  return arr;
}