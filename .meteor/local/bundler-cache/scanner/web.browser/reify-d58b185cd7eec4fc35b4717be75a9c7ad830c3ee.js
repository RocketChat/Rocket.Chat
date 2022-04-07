let partial;module.link('./partial.js',{default(v){partial=v}},0);let before;module.link('./before.js',{default(v){before=v}},1);


// Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.
module.exportDefault(partial(before, 2));
