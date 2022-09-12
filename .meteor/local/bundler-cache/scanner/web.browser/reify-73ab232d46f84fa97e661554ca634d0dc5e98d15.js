let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let unzip;module.link('./unzip.js',{default(v){unzip=v}},1);


// Zip together multiple lists into a single array -- elements that share
// an index go together.
module.exportDefault(restArguments(unzip));
