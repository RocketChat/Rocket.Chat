module.export({default:()=>tagTester});let toString;module.link('./_setup.js',{toString(v){toString=v}},0);

// Internal function for creating a `toString`-based type tester.
function tagTester(name) {
  var tag = '[object ' + name + ']';
  return function(obj) {
    return toString.call(obj) === tag;
  };
}
