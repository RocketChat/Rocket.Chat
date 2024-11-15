module.export({default:()=>isFinite});let _isFinite;module.link('./_setup.js',{_isFinite(v){_isFinite=v}},0);let isSymbol;module.link('./isSymbol.js',{default(v){isSymbol=v}},1);


// Is a given object a finite number?
function isFinite(obj) {
  return !isSymbol(obj) && _isFinite(obj) && !isNaN(parseFloat(obj));
}
