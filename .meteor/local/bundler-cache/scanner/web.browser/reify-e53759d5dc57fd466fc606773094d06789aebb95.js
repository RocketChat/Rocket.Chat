let supportsArrayBuffer,nativeIsView,toString;module.link('./_setup.js',{supportsArrayBuffer(v){supportsArrayBuffer=v},nativeIsView(v){nativeIsView=v},toString(v){toString=v}},0);let isDataView;module.link('./isDataView.js',{default(v){isDataView=v}},1);let constant;module.link('./constant.js',{default(v){constant=v}},2);let isBufferLike;module.link('./_isBufferLike.js',{default(v){isBufferLike=v}},3);




// Is a given value a typed array?
var typedArrayPattern = /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
function isTypedArray(obj) {
  // `ArrayBuffer.isView` is the most future-proof, so use it when available.
  // Otherwise, fall back on the above regular expression.
  return nativeIsView ? (nativeIsView(obj) && !isDataView(obj)) :
                isBufferLike(obj) && typedArrayPattern.test(toString.call(obj));
}

module.exportDefault(supportsArrayBuffer ? isTypedArray : constant(false));
