let group;module.link('./_group.js',{default(v){group=v}},0);let has;module.link('./_has.js',{default(v){has=v}},1);


// Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.
module.exportDefault(group(function(result, value, key) {
  if (has(result, key)) result[key].push(value); else result[key] = [value];
}));
