let tagTester;module.link('./_tagTester.js',{default(v){tagTester=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let isArrayBuffer;module.link('./isArrayBuffer.js',{default(v){isArrayBuffer=v}},2);let hasStringTagBug;module.link('./_stringTagBug.js',{hasStringTagBug(v){hasStringTagBug=v}},3);




var isDataView = tagTester('DataView');

// In IE 10 - Edge 13, we need a different heuristic
// to determine whether an object is a `DataView`.
function ie10IsDataView(obj) {
  return obj != null && isFunction(obj.getInt8) && isArrayBuffer(obj.buffer);
}

module.exportDefault(hasStringTagBug ? ie10IsDataView : isDataView);
