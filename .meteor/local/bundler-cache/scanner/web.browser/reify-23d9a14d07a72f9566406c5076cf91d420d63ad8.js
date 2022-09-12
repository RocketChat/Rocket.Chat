module.export({default:()=>isNaN});let _isNaN;module.link('./_setup.js',{_isNaN(v){_isNaN=v}},0);let isNumber;module.link('./isNumber.js',{default(v){isNumber=v}},1);


// Is the given value `NaN`?
function isNaN(obj) {
  return isNumber(obj) && _isNaN(obj);
}
