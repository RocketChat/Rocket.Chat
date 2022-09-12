let createAssigner;module.link('./_createAssigner.js',{default(v){createAssigner=v}},0);let keys;module.link('./keys.js',{default(v){keys=v}},1);


// Assigns a given object with all the own properties in the passed-in
// object(s).
// (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
module.exportDefault(createAssigner(keys));
