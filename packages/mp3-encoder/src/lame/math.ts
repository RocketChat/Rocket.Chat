export function blackmanWindow(x: number, fcn: number, l: number) {
  const wcn = Math.PI * fcn;

  x /= l;
  if (x < 0) x = 0;
  if (x > 1) x = 1;
  const x2 = x - 0.5;

  const bkwn =
    0.42 - 0.5 * Math.cos(2 * x * Math.PI) + 0.08 * Math.cos(4 * x * Math.PI);
  if (Math.abs(x2) < 1e-9) return wcn / Math.PI;
  return (bkwn * Math.sin(l * wcn * x2)) / (Math.PI * l * x2);
}

export function gcd(i: number, j: number): number {
  return j !== 0 ? gcd(j, i % j) : i;
}

export function isCloseToEachOther(a: number, b: number) {
  return Math.abs(a) > Math.abs(b)
    ? Math.abs(a - b) <= Math.abs(a) * 1e-6
    : Math.abs(a - b) <= Math.abs(b) * 1e-6;
}

export function fsqr(d: number) {
  return d * d;
}

export function equals(a: number, b: number) {
  return !(Math.abs(a - b) > 0);
}
