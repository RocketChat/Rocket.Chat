import type { LameInternalFlags } from './LameInternalFlags';
import { BLKSIZE, BLKSIZE_s } from './constants';

export class FFT {
  private window: Float32Array = new Float32Array(BLKSIZE);

  private window_s: Float32Array = new Float32Array(BLKSIZE_s / 2);

  private readonly costab = [
    9.238795325112867e-1, 3.826834323650898e-1, 9.951847266721969e-1,
    9.80171403295606e-2, 9.996988186962042e-1, 2.454122852291229e-2,
    9.999811752826011e-1, 6.135884649154475e-3,
  ] as const;

  private fht(fz: Float32Array, fzPos: number, n: number) {
    let tri = 0;
    let k4: number;
    let fi: number;
    let gi: number;

    n <<= 1;

    const fn = fzPos + n;
    k4 = 4;
    do {
      let s1;
      let c1;
      let i;
      const kx = k4 >> 1;
      const k1 = k4;
      const k2 = k4 << 1;
      const k3 = k2 + k1;
      k4 = k2 << 1;
      fi = fzPos;
      gi = fi + kx;
      do {
        let f0;
        let f1;
        let f2;
        let f3;
        f1 = fz[fi + 0] - fz[fi + k1];
        f0 = fz[fi + 0] + fz[fi + k1];
        f3 = fz[fi + k2] - fz[fi + k3];
        f2 = fz[fi + k2] + fz[fi + k3];
        fz[fi + k2] = f0 - f2;
        fz[fi + 0] = f0 + f2;
        fz[fi + k3] = f1 - f3;
        fz[fi + k1] = f1 + f3;
        f1 = fz[gi + 0] - fz[gi + k1];
        f0 = fz[gi + 0] + fz[gi + k1];
        f3 = Math.SQRT2 * fz[gi + k3];
        f2 = Math.SQRT2 * fz[gi + k2];
        fz[gi + k2] = f0 - f2;
        fz[gi + 0] = f0 + f2;
        fz[gi + k3] = f1 - f3;
        fz[gi + k1] = f1 + f3;
        gi += k4;
        fi += k4;
      } while (fi < fn);
      c1 = this.costab[tri + 0];
      s1 = this.costab[tri + 1];
      for (i = 1; i < kx; i++) {
        let c2: number = 1 - 2 * s1 * s1;
        const s2 = 2 * s1 * c1;
        fi = fzPos + i;
        gi = fzPos + k1 - i;
        do {
          let a: number;
          let b: number;
          b = s2 * fz[fi + k1] - c2 * fz[gi + k1];
          a = c2 * fz[fi + k1] + s2 * fz[gi + k1];
          const f1 = fz[fi + 0] - a;
          const f0 = fz[fi + 0] + a;
          const g1 = fz[gi + 0] - b;
          const g0 = fz[gi + 0] + b;
          b = s2 * fz[fi + k3] - c2 * fz[gi + k3];
          a = c2 * fz[fi + k3] + s2 * fz[gi + k3];
          const f3 = fz[fi + k2] - a;
          const f2 = fz[fi + k2] + a;
          const g3 = fz[gi + k2] - b;
          const g2 = fz[gi + k2] + b;
          b = s1 * f2 - c1 * g3;
          a = c1 * f2 + s1 * g3;
          fz[fi + k2] = f0 - a;
          fz[fi + 0] = f0 + a;
          fz[gi + k3] = g1 - b;
          fz[gi + k1] = g1 + b;
          b = c1 * g2 - s1 * f3;
          a = s1 * g2 + c1 * f3;
          fz[gi + k2] = g0 - a;
          fz[gi + 0] = g0 + a;
          fz[fi + k3] = f1 - b;
          fz[fi + k1] = f1 + b;
          gi += k4;
          fi += k4;
        } while (fi < fn);
        c2 = c1;
        c1 = c2 * this.costab[tri + 0] - s1 * this.costab[tri + 1];
        s1 = c2 * this.costab[tri + 1] + s1 * this.costab[tri + 0];
      }
      tri += 2;
    } while (k4 < n);
  }

  private readonly rv_tbl = [
    0x00, 0x80, 0x40, 0xc0, 0x20, 0xa0, 0x60, 0xe0, 0x10, 0x90, 0x50, 0xd0,
    0x30, 0xb0, 0x70, 0xf0, 0x08, 0x88, 0x48, 0xc8, 0x28, 0xa8, 0x68, 0xe8,
    0x18, 0x98, 0x58, 0xd8, 0x38, 0xb8, 0x78, 0xf8, 0x04, 0x84, 0x44, 0xc4,
    0x24, 0xa4, 0x64, 0xe4, 0x14, 0x94, 0x54, 0xd4, 0x34, 0xb4, 0x74, 0xf4,
    0x0c, 0x8c, 0x4c, 0xcc, 0x2c, 0xac, 0x6c, 0xec, 0x1c, 0x9c, 0x5c, 0xdc,
    0x3c, 0xbc, 0x7c, 0xfc, 0x02, 0x82, 0x42, 0xc2, 0x22, 0xa2, 0x62, 0xe2,
    0x12, 0x92, 0x52, 0xd2, 0x32, 0xb2, 0x72, 0xf2, 0x0a, 0x8a, 0x4a, 0xca,
    0x2a, 0xaa, 0x6a, 0xea, 0x1a, 0x9a, 0x5a, 0xda, 0x3a, 0xba, 0x7a, 0xfa,
    0x06, 0x86, 0x46, 0xc6, 0x26, 0xa6, 0x66, 0xe6, 0x16, 0x96, 0x56, 0xd6,
    0x36, 0xb6, 0x76, 0xf6, 0x0e, 0x8e, 0x4e, 0xce, 0x2e, 0xae, 0x6e, 0xee,
    0x1e, 0x9e, 0x5e, 0xde, 0x3e, 0xbe, 0x7e, 0xfe,
  ] as const;

  fft_short(
    _gfc: LameInternalFlags,
    x_real: Float32Array[],
    chn: number,
    buffer: Float32Array[],
    bufPos: number,
  ) {
    for (let b = 0; b < 3; b++) {
      let x = BLKSIZE_s / 2;
      const k = 0xffff & ((576 / 3) * (b + 1));
      let j = BLKSIZE_s / 8 - 1;
      do {
        let f0;
        let f1;
        let f2;
        let f3;
        let w;
        const i = this.rv_tbl[j << 2] & 0xff;

        f0 = this.window_s[i] * buffer[chn][bufPos + i + k];
        w = this.window_s[0x7f - i] * buffer[chn][bufPos + i + k + 0x80];
        f1 = f0 - w;
        f0 += w;
        f2 = this.window_s[i + 0x40] * buffer[chn][bufPos + i + k + 0x40];
        w = this.window_s[0x3f - i] * buffer[chn][bufPos + i + k + 0xc0];
        f3 = f2 - w;
        f2 += w;

        x -= 4;
        x_real[b][x + 0] = f0 + f2;
        x_real[b][x + 2] = f0 - f2;
        x_real[b][x + 1] = f1 + f3;
        x_real[b][x + 3] = f1 - f3;

        f0 = this.window_s[i + 0x01] * buffer[chn][bufPos + i + k + 0x01];
        w = this.window_s[0x7e - i] * buffer[chn][bufPos + i + k + 0x81];
        f1 = f0 - w;
        f0 += w;
        f2 = this.window_s[i + 0x41] * buffer[chn][bufPos + i + k + 0x41];
        w = this.window_s[0x3e - i] * buffer[chn][bufPos + i + k + 0xc1];
        f3 = f2 - w;
        f2 += w;

        x_real[b][x + BLKSIZE_s / 2 + 0] = f0 + f2;
        x_real[b][x + BLKSIZE_s / 2 + 2] = f0 - f2;
        x_real[b][x + BLKSIZE_s / 2 + 1] = f1 + f3;
        x_real[b][x + BLKSIZE_s / 2 + 3] = f1 - f3;
      } while (--j >= 0);

      this.fht(x_real[b], x, BLKSIZE_s / 2);
    }
  }

  fft_long(
    _gfc: LameInternalFlags,
    y: Float32Array,
    chn: number,
    buffer: Float32Array[],
    bufPos: number,
  ) {
    let jj = BLKSIZE / 8 - 1;
    let x = BLKSIZE / 2;

    do {
      let f0;
      let f1;
      let f2;
      let f3;
      let w;
      const i = this.rv_tbl[jj] & 0xff;
      f0 = this.window[i] * buffer[chn][bufPos + i];
      w = this.window[i + 0x200] * buffer[chn][bufPos + i + 0x200];
      f1 = f0 - w;
      f0 += w;
      f2 = this.window[i + 0x100] * buffer[chn][bufPos + i + 0x100];
      w = this.window[i + 0x300] * buffer[chn][bufPos + i + 0x300];
      f3 = f2 - w;
      f2 += w;

      x -= 4;
      y[x + 0] = f0 + f2;
      y[x + 2] = f0 - f2;
      y[x + 1] = f1 + f3;
      y[x + 3] = f1 - f3;

      f0 = this.window[i + 0x001] * buffer[chn][bufPos + i + 0x001];
      w = this.window[i + 0x201] * buffer[chn][bufPos + i + 0x201];
      f1 = f0 - w;
      f0 += w;
      f2 = this.window[i + 0x101] * buffer[chn][bufPos + i + 0x101];
      w = this.window[i + 0x301] * buffer[chn][bufPos + i + 0x301];
      f3 = f2 - w;
      f2 += w;

      y[x + BLKSIZE / 2 + 0] = f0 + f2;
      y[x + BLKSIZE / 2 + 2] = f0 - f2;
      y[x + BLKSIZE / 2 + 1] = f1 + f3;
      y[x + BLKSIZE / 2 + 3] = f1 - f3;
    } while (--jj >= 0);

    this.fht(y, x, BLKSIZE / 2);
  }

  init() {
    for (let i = 0; i < BLKSIZE; i++) {
      this.window[i] =
        0.42 -
        0.5 * Math.cos((2 * Math.PI * (i + 0.5)) / BLKSIZE) +
        0.08 * Math.cos((4 * Math.PI * (i + 0.5)) / BLKSIZE);
    }

    for (let i = 0; i < BLKSIZE_s / 2; i++) {
      this.window_s[i] =
        0.5 * (1.0 - Math.cos((2.0 * Math.PI * (i + 0.5)) / BLKSIZE_s));
    }
  }
}
