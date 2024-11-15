module.export({abs:()=>abs,atan2:()=>atan2,cos:()=>cos,max:()=>max,min:()=>min,sin:()=>sin,sqrt:()=>sqrt,epsilon:()=>epsilon,pi:()=>pi,halfPi:()=>halfPi,tau:()=>tau,acos:()=>acos,asin:()=>asin});var abs = Math.abs;
var atan2 = Math.atan2;
var cos = Math.cos;
var max = Math.max;
var min = Math.min;
var sin = Math.sin;
var sqrt = Math.sqrt;

var epsilon = 1e-12;
var pi = Math.PI;
var halfPi = pi / 2;
var tau = 2 * pi;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
}
