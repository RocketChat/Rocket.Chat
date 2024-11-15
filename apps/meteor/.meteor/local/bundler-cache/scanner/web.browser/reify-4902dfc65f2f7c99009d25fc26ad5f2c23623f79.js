module.export({default:()=>toPropertyKey});let _typeof;module.link("./typeof.js",{default(v){_typeof=v}},0);let toPrimitive;module.link("./toPrimitive.js",{default(v){toPrimitive=v}},1);

function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
