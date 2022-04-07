let createSizePropertyCheck;module.link('./_createSizePropertyCheck.js',{default(v){createSizePropertyCheck=v}},0);let getLength;module.link('./_getLength.js',{default(v){getLength=v}},1);


// Internal helper for collection methods to determine whether a collection
// should be iterated as an array or as an object.
// Related: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
// Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
module.exportDefault(createSizePropertyCheck(getLength));
