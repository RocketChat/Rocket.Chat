module.export({expIn:()=>expIn,expOut:()=>expOut,expInOut:()=>expInOut});let tpmt;module.link("./math.js",{tpmt(v){tpmt=v}},0);

function expIn(t) {
  return tpmt(1 - +t);
}

function expOut(t) {
  return 1 - tpmt(t);
}

function expInOut(t) {
  return ((t *= 2) <= 1 ? tpmt(1 - t) : 2 - tpmt(t - 1)) / 2;
}
