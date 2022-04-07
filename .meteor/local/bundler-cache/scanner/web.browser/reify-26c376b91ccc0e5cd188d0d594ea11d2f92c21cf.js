let group;module.link('./_group.js',{default(v){group=v}},0);

// Split a collection into two arrays: one whose elements all pass the given
// truth test, and one whose elements all do not pass the truth test.
module.exportDefault(group(function(result, value, pass) {
  result[pass ? 0 : 1].push(value);
}, true));
