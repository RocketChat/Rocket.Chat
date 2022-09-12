let partial;module.link('./partial.js',{default(v){partial=v}},0);let delay;module.link('./delay.js',{default(v){delay=v}},1);let _;module.link('./underscore.js',{default(v){_=v}},2);



// Defers a function, scheduling it to run after the current call stack has
// cleared.
module.exportDefault(partial(delay, _, 1));
