let createSizePropertyCheck;module.link('./_createSizePropertyCheck.js',{default(v){createSizePropertyCheck=v}},0);let getByteLength;module.link('./_getByteLength.js',{default(v){getByteLength=v}},1);


// Internal helper to determine whether we should spend extensive checks against
// `ArrayBuffer` et al.
module.exportDefault(createSizePropertyCheck(getByteLength));
