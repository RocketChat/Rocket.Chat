module.export({default:()=>cloneObject});let assign;module.link("../assign/index.js",{default(v){assign=v}},0);
function cloneObject(dirtyObject) {
  return assign({}, dirtyObject);
}