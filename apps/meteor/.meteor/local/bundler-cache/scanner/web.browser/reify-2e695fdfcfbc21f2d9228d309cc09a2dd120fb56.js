module.export({default:()=>createSizePropertyCheck});let MAX_ARRAY_INDEX;module.link('./_setup.js',{MAX_ARRAY_INDEX(v){MAX_ARRAY_INDEX=v}},0);

// Common internal logic for `isArrayLike` and `isBufferLike`.
function createSizePropertyCheck(getSizeProperty) {
  return function(collection) {
    var sizeProperty = getSizeProperty(collection);
    return typeof sizeProperty == 'number' && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
  }
}
