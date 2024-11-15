let tagTester;module.link('./_tagTester.js',{default(v){tagTester=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let isArrayBuffer;module.link('./isArrayBuffer.js',{default(v){isArrayBuffer=v}},2);let hasDataViewBug;module.link('./_stringTagBug.js',{hasDataViewBug(v){hasDataViewBug=v}},3);




var isDataView = tagTester('DataView');

// In IE 10 - Edge 13, we need a different heuristic
// to determine whether an object is a `DataView`.
// Also, in cases where the native `DataView` is
// overridden we can't rely on the tag itself.
function alternateIsDataView(obj) {
  return obj != null && isFunction(obj.getInt8) && isArrayBuffer(obj.buffer);
}

module.exportDefault(hasDataViewBug ? alternateIsDataView : isDataView);
