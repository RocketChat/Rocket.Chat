let nativeIsArray;module.link('./_setup.js',{nativeIsArray(v){nativeIsArray=v}},0);let tagTester;module.link('./_tagTester.js',{default(v){tagTester=v}},1);


// Is a given value an array?
// Delegates to ECMA5's native `Array.isArray`.
module.exportDefault(nativeIsArray || tagTester('Array'));
