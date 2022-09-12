let group;module.link('./_group.js',{default(v){group=v}},0);

// Indexes the object's values by a criterion, similar to `_.groupBy`, but for
// when you know that your index values will be unique.
module.exportDefault(group(function(result, value, key) {
  result[key] = value;
}));
