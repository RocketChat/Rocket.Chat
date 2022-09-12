module.export({default:()=>subset});let superset;module.link("./superset.js",{default(v){superset=v}},0);

function subset(values, other) {
  return superset(other, values);
}
