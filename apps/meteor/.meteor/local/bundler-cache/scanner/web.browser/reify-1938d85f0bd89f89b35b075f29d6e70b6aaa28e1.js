module.export({acos:()=>acos,asin:()=>asin});module.export({abs:()=>abs,atan2:()=>atan2,cos:()=>cos,max:()=>max,min:()=>min,sin:()=>sin,sqrt:()=>sqrt,epsilon:()=>epsilon,pi:()=>pi,halfPi:()=>halfPi,tau:()=>tau},true);const abs = Math.abs;
const atan2 = Math.atan2;
const cos = Math.cos;
const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const sqrt = Math.sqrt;

const epsilon = 1e-12;
const pi = Math.PI;
const halfPi = pi / 2;
const tau = 2 * pi;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
}
