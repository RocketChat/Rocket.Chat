import { Bits } from './Bits';
import type { CalcNoiseData } from './CalcNoiseData';
import { GrInfo } from './GrInfo';
import type { IIISideInfo } from './IIISideInfo';
import type { LameInternalFlags } from './LameInternalFlags';
import { QuantizePVT } from './QuantizePVT';
import * as tables from './Tables';
import { fillArray } from './arrays';
import { assert } from './assert';
import { NORM_TYPE, SBMAX_l, SBPSY_l, SHORT_TYPE } from './constants';

export class Takehiro {
  private static readonly LARGE_BITS = 100000;

  private readonly qupvt: QuantizePVT;

  constructor(qupvt: QuantizePVT) {
    this.qupvt = qupvt;
  }

  private readonly largetbl = [
    0x010004, 0x050005, 0x070007, 0x090008, 0x0a0009, 0x0a000a, 0x0b000a,
    0x0b000b, 0x0c000b, 0x0c000c, 0x0c000c, 0x0d000c, 0x0d000c, 0x0d000c,
    0x0e000d, 0x0a000a, 0x040005, 0x060006, 0x080007, 0x090008, 0x0a0009,
    0x0b000a, 0x0b000a, 0x0b000b, 0x0c000b, 0x0c000b, 0x0c000c, 0x0d000c,
    0x0e000c, 0x0d000c, 0x0e000c, 0x0a000a, 0x070007, 0x080007, 0x090008,
    0x0a0009, 0x0b0009, 0x0b000a, 0x0c000a, 0x0c000b, 0x0d000b, 0x0c000b,
    0x0d000b, 0x0d000c, 0x0d000c, 0x0e000c, 0x0e000d, 0x0b0009, 0x090008,
    0x090008, 0x0a0009, 0x0b0009, 0x0b000a, 0x0c000a, 0x0c000a, 0x0c000b,
    0x0d000b, 0x0d000b, 0x0e000b, 0x0e000c, 0x0e000c, 0x0f000c, 0x0f000c,
    0x0c0009, 0x0a0009, 0x0a0009, 0x0b0009, 0x0b000a, 0x0c000a, 0x0c000a,
    0x0d000a, 0x0d000b, 0x0d000b, 0x0e000b, 0x0e000c, 0x0e000c, 0x0f000c,
    0x0f000c, 0x0f000d, 0x0b0009, 0x0a000a, 0x0a0009, 0x0b000a, 0x0b000a,
    0x0c000a, 0x0d000a, 0x0d000b, 0x0e000b, 0x0d000b, 0x0e000b, 0x0e000c,
    0x0f000c, 0x0f000c, 0x0f000c, 0x10000c, 0x0c0009, 0x0b000a, 0x0b000a,
    0x0b000a, 0x0c000a, 0x0d000a, 0x0d000b, 0x0d000b, 0x0d000b, 0x0e000b,
    0x0e000c, 0x0e000c, 0x0e000c, 0x0f000c, 0x0f000c, 0x10000d, 0x0c0009,
    0x0b000b, 0x0b000a, 0x0c000a, 0x0c000a, 0x0d000b, 0x0d000b, 0x0d000b,
    0x0e000b, 0x0e000c, 0x0f000c, 0x0f000c, 0x0f000c, 0x0f000c, 0x11000d,
    0x11000d, 0x0c000a, 0x0b000b, 0x0c000b, 0x0c000b, 0x0d000b, 0x0d000b,
    0x0d000b, 0x0e000b, 0x0e000b, 0x0f000b, 0x0f000c, 0x0f000c, 0x0f000c,
    0x10000c, 0x10000d, 0x10000d, 0x0c000a, 0x0c000b, 0x0c000b, 0x0c000b,
    0x0d000b, 0x0d000b, 0x0e000b, 0x0e000b, 0x0f000c, 0x0f000c, 0x0f000c,
    0x0f000c, 0x10000c, 0x0f000d, 0x10000d, 0x0f000d, 0x0d000a, 0x0c000c,
    0x0d000b, 0x0c000b, 0x0d000b, 0x0e000b, 0x0e000c, 0x0e000c, 0x0e000c,
    0x0f000c, 0x10000c, 0x10000c, 0x10000d, 0x11000d, 0x11000d, 0x10000d,
    0x0c000a, 0x0d000c, 0x0d000c, 0x0d000b, 0x0d000b, 0x0e000b, 0x0e000c,
    0x0f000c, 0x10000c, 0x10000c, 0x10000c, 0x10000c, 0x10000d, 0x10000d,
    0x0f000d, 0x10000d, 0x0d000a, 0x0d000c, 0x0e000c, 0x0e000c, 0x0e000c,
    0x0e000c, 0x0f000c, 0x0f000c, 0x0f000c, 0x0f000c, 0x11000c, 0x10000d,
    0x10000d, 0x10000d, 0x10000d, 0x12000d, 0x0d000a, 0x0f000c, 0x0e000c,
    0x0e000c, 0x0e000c, 0x0f000c, 0x0f000c, 0x10000c, 0x10000c, 0x10000d,
    0x12000d, 0x11000d, 0x11000d, 0x11000d, 0x13000d, 0x11000d, 0x0d000a,
    0x0e000d, 0x0f000c, 0x0d000c, 0x0e000c, 0x10000c, 0x10000c, 0x0f000c,
    0x10000d, 0x10000d, 0x11000d, 0x12000d, 0x11000d, 0x13000d, 0x11000d,
    0x10000d, 0x0d000a, 0x0a0009, 0x0a0009, 0x0a0009, 0x0b0009, 0x0b0009,
    0x0c0009, 0x0c0009, 0x0c0009, 0x0d0009, 0x0d0009, 0x0d0009, 0x0d000a,
    0x0d000a, 0x0d000a, 0x0d000a, 0x0a0006,
  ] as const;

  private readonly table23 = [
    0x010002, 0x040003, 0x070007, 0x040004, 0x050004, 0x070007, 0x060006,
    0x070007, 0x080008,
  ] as const;

  private readonly table56 = [
    0x010003, 0x040004, 0x070006, 0x080008, 0x040004, 0x050004, 0x080006,
    0x090007, 0x070005, 0x080006, 0x090007, 0x0a0008, 0x080007, 0x080007,
    0x090008, 0x0a0009,
  ] as const;

  private readonly scfsi_band = [0, 6, 11, 16, 21] as const;

  private readonly subdv_table = [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
    [2, 3],
    [3, 4],
    [3, 4],
    [3, 4],
    [4, 5],
    [4, 5],
    [4, 6],
    [5, 6],
    [5, 6],
    [5, 7],
    [6, 7],
    [6, 7],
  ] as const;

  private quantize_lines_xrpow_01(
    l: number,
    istep: number,
    xr: Float32Array,
    xrPos: number,
    ix: Int32Array,
    ixPos: number,
  ) {
    const compareval0 = (1.0 - 0.4054) / istep;

    assert(l > 0);
    l >>= 1;
    while (l-- !== 0) {
      ix[ixPos++] = compareval0 > xr[xrPos++] ? 0 : 1;
      ix[ixPos++] = compareval0 > xr[xrPos++] ? 0 : 1;
    }
  }

  private quantize_lines_xrpow(
    l: number,
    istep: number,
    xr: Float32Array,
    xrPos: number,
    ix: Int32Array,
    ixPos: number,
  ) {
    assert(l > 0);

    l >>= 1;
    const remaining = l % 2;
    l >>= 1;
    while (l-- !== 0) {
      let x0 = xr[xrPos++] * istep;
      let x1 = xr[xrPos++] * istep;
      const rx0 = Math.trunc(x0);
      let x2 = xr[xrPos++] * istep;
      const rx1 = Math.trunc(x1);
      let x3 = xr[xrPos++] * istep;
      const rx2 = Math.trunc(x2);
      x0 += this.qupvt.adj43(rx0);
      const rx3 = Math.trunc(x3);
      x1 += this.qupvt.adj43(rx1);
      ix[ixPos++] = Math.trunc(x0);
      x2 += this.qupvt.adj43(rx2);
      ix[ixPos++] = Math.trunc(x1);
      x3 += this.qupvt.adj43(rx3);
      ix[ixPos++] = Math.trunc(x2);
      ix[ixPos++] = Math.trunc(x3);
    }
    if (remaining !== 0) {
      let x0 = xr[xrPos++] * istep;
      let x1 = xr[xrPos++] * istep;
      const rx0 = Math.trunc(x0);
      const rx1 = Math.trunc(x1);
      x0 += this.qupvt.adj43(rx0);
      x1 += this.qupvt.adj43(rx1);
      ix[ixPos++] = Math.trunc(x0);
      ix[ixPos++] = Math.trunc(x1);
    }
  }

  private quantize_xrpow(
    xp: Float32Array,
    pi: Int32Array,
    istep: number,
    codInfo: GrInfo,
    prevNoise: CalcNoiseData | null,
  ) {
    let sfb;
    let sfbmax;
    let j = 0;
    let accumulate = 0;
    let accumulate01 = 0;
    let xpPos = 0;
    const iData = pi;
    let iDataPos = 0;
    let acc_iData = iData;
    let acc_iDataPos = 0;
    let acc_xp = xp;
    let acc_xpPos = 0;

    const prev_data_use =
      prevNoise !== null && codInfo.global_gain === prevNoise.global_gain;

    if (codInfo.block_type === SHORT_TYPE) sfbmax = 38;
    else sfbmax = 21;

    for (sfb = 0; sfb <= sfbmax; sfb++) {
      let step = -1;

      if (prev_data_use || codInfo.block_type === NORM_TYPE) {
        step =
          codInfo.global_gain -
          ((codInfo.scalefac[sfb] +
            (codInfo.preflag !== 0 ? this.qupvt.pretab[sfb] : 0)) <<
            (codInfo.scalefac_scale + 1)) -
          codInfo.subblock_gain[codInfo.window[sfb]] * 8;
      }
      assert(codInfo.width[sfb] >= 0);
      if (prev_data_use && prevNoise.step[sfb] === step) {
        if (accumulate !== 0) {
          this.quantize_lines_xrpow(
            accumulate,
            istep,
            acc_xp,
            acc_xpPos,
            acc_iData,
            acc_iDataPos,
          );
          accumulate = 0;
        }
        if (accumulate01 !== 0) {
          this.quantize_lines_xrpow_01(
            accumulate01,
            istep,
            acc_xp,
            acc_xpPos,
            acc_iData,
            acc_iDataPos,
          );
          accumulate01 = 0;
        }
      } else {
        let l = codInfo.width[sfb];

        if (j + codInfo.width[sfb] > codInfo.max_nonzero_coeff) {
          const usefullsize = codInfo.max_nonzero_coeff - j + 1;
          fillArray(pi, codInfo.max_nonzero_coeff, 576, 0);
          l = usefullsize;

          if (l < 0) {
            l = 0;
          }

          sfb = sfbmax + 1;
        }

        if (accumulate === 0 && accumulate01 === 0) {
          acc_iData = iData;
          acc_iDataPos = iDataPos;
          acc_xp = xp;
          acc_xpPos = xpPos;
        }
        if (
          prevNoise !== null &&
          prevNoise.sfb_count1 > 0 &&
          sfb >= prevNoise.sfb_count1 &&
          prevNoise.step[sfb] > 0 &&
          step >= prevNoise.step[sfb]
        ) {
          if (accumulate !== 0) {
            this.quantize_lines_xrpow(
              accumulate,
              istep,
              acc_xp,
              acc_xpPos,
              acc_iData,
              acc_iDataPos,
            );
            accumulate = 0;
            acc_iData = iData;
            acc_iDataPos = iDataPos;
            acc_xp = xp;
            acc_xpPos = xpPos;
          }
          accumulate01 += l;
        } else {
          if (accumulate01 !== 0) {
            this.quantize_lines_xrpow_01(
              accumulate01,
              istep,
              acc_xp,
              acc_xpPos,
              acc_iData,
              acc_iDataPos,
            );
            accumulate01 = 0;
            acc_iData = iData;
            acc_iDataPos = iDataPos;
            acc_xp = xp;
            acc_xpPos = xpPos;
          }
          accumulate += l;
        }

        if (l <= 0) {
          if (accumulate01 !== 0) {
            this.quantize_lines_xrpow_01(
              accumulate01,
              istep,
              acc_xp,
              acc_xpPos,
              acc_iData,
              acc_iDataPos,
            );
            accumulate01 = 0;
          }
          if (accumulate !== 0) {
            this.quantize_lines_xrpow(
              accumulate,
              istep,
              acc_xp,
              acc_xpPos,
              acc_iData,
              acc_iDataPos,
            );
            accumulate = 0;
          }

          break;
        }
      }
      if (sfb <= sfbmax) {
        iDataPos += codInfo.width[sfb];
        xpPos += codInfo.width[sfb];
        j += codInfo.width[sfb];
      }
    }

    if (accumulate !== 0) {
      this.quantize_lines_xrpow(
        accumulate,
        istep,
        acc_xp,
        acc_xpPos,
        acc_iData,
        acc_iDataPos,
      );
    }

    if (accumulate01 !== 0) {
      this.quantize_lines_xrpow_01(
        accumulate01,
        istep,
        acc_xp,
        acc_xpPos,
        acc_iData,
        acc_iDataPos,
      );
    }
  }

  private ix_max(ix: Int32Array, ixPos: number, endPos: number) {
    let max1 = 0;
    let max2 = 0;

    do {
      const x1 = ix[ixPos++];
      const x2 = ix[ixPos++];
      if (max1 < x1) max1 = x1;

      if (max2 < x2) max2 = x2;
    } while (ixPos < endPos);
    if (max1 < max2) max1 = max2;
    return max1;
  }

  private count_bit_ESC(
    ix: Int32Array,
    ixPos: number,
    end: number,
    t1: number,
    t2: number,
    s: Bits,
  ) {
    const linbits = tables.ht[t1].xlen * 65536 + tables.ht[t2].xlen;
    let sum = 0;
    do {
      let x = ix[ixPos++];
      let y = ix[ixPos++];

      if (x !== 0) {
        if (x > 14) {
          x = 15;
          sum += linbits;
        }
        x *= 16;
      }

      if (y !== 0) {
        if (y > 14) {
          y = 15;
          sum += linbits;
        }
        x += y;
      }

      sum += this.largetbl[x];
    } while (ixPos < end);

    const sum2 = sum & 0xffff;
    sum >>= 16;

    if (sum > sum2) {
      sum = sum2;
      t1 = t2;
    }

    s.bits += sum;
    return t1;
  }

  private count_bit_noESC(ix: Int32Array, ixPos: number, end: number, s: Bits) {
    let sum1 = 0;
    const hlen1 = tables.ht[1].hlen;
    assert(hlen1 !== undefined);

    do {
      const x = ix[ixPos + 0] * 2 + ix[ixPos + 1];
      ixPos += 2;
      sum1 += hlen1[x];
    } while (ixPos < end);

    s.bits += sum1;
    return 1;
  }

  private count_bit_noESC_from2(
    ix: Int32Array,
    ixPos: number,
    end: number,
    t1: number,
    s: Bits,
  ) {
    let sum = 0;
    const { xlen } = tables.ht[t1];
    let hlen;
    if (t1 === 2) hlen = this.table23;
    else hlen = this.table56;

    do {
      const x = ix[ixPos + 0] * xlen + ix[ixPos + 1];
      ixPos += 2;
      sum += hlen[x];
    } while (ixPos < end);

    const sum2 = sum & 0xffff;
    sum >>= 16;

    if (sum > sum2) {
      sum = sum2;
      t1++;
    }

    s.bits += sum;
    return t1;
  }

  private count_bit_noESC_from3(
    ix: Int32Array,
    ixPos: number,
    end: number,
    t1: number,
    s: Bits,
  ) {
    let sum1 = 0;
    let sum2 = 0;
    let sum3 = 0;
    const { xlen } = tables.ht[t1];
    const hlen1 = tables.ht[t1].hlen;
    const hlen2 = tables.ht[t1 + 1].hlen;
    const hlen3 = tables.ht[t1 + 2].hlen;

    assert(hlen1 !== undefined);
    assert(hlen2 !== undefined);
    assert(hlen3 !== undefined);

    do {
      const x = ix[ixPos + 0] * xlen + ix[ixPos + 1];
      ixPos += 2;
      sum1 += hlen1[x];
      sum2 += hlen2[x];
      sum3 += hlen3[x];
    } while (ixPos < end);
    let t = t1;
    if (sum1 > sum2) {
      sum1 = sum2;
      t++;
    }
    if (sum1 > sum3) {
      sum1 = sum3;
      t = t1 + 2;
    }
    s.bits += sum1;

    return t;
  }

  private readonly huf_tbl_noESC = [
    1, 2, 5, 7, 7, 10, 10, 13, 13, 13, 13, 13, 13, 13, 13,
  ] as const;

  private choose_table(ix: Int32Array, ixPos: number, endPos: number, s: Bits) {
    let max = this.ix_max(ix, ixPos, endPos);

    switch (max) {
      case 0:
        return max;

      case 1:
        return this.count_bit_noESC(ix, ixPos, endPos, s);

      case 2:
      case 3:
        return this.count_bit_noESC_from2(
          ix,
          ixPos,
          endPos,
          this.huf_tbl_noESC[max - 1],
          s,
        );

      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
        return this.count_bit_noESC_from3(
          ix,
          ixPos,
          endPos,
          this.huf_tbl_noESC[max - 1],
          s,
        );

      default:
        if (max > QuantizePVT.IXMAX_VAL) {
          s.bits = Takehiro.LARGE_BITS;
          return -1;
        }
        max -= 15;
        let choice2;
        for (choice2 = 24; choice2 < 32; choice2++) {
          if (tables.ht[choice2].linmax >= max) {
            break;
          }
        }
        let choice;
        for (choice = choice2 - 8; choice < 24; choice++) {
          if (tables.ht[choice].linmax >= max) {
            break;
          }
        }
        return this.count_bit_ESC(ix, ixPos, endPos, choice, choice2, s);
    }
  }

  noquant_count_bits(
    gfc: LameInternalFlags,
    gi: GrInfo,
    prev_noise: CalcNoiseData | null,
  ) {
    const ix = gi.l3_enc;
    let i = Math.min(576, ((gi.max_nonzero_coeff + 2) >> 1) << 1);

    if (prev_noise !== null) prev_noise.sfb_count1 = 0;

    for (; i > 1; i -= 2) if ((ix[i - 1] | ix[i - 2]) !== 0) break;
    gi.count1 = i;

    let a1 = 0;
    let a2 = 0;
    for (; i > 3; i -= 4) {
      if (((ix[i - 1] | ix[i - 2] | ix[i - 3] | ix[i - 4]) & 0x7fffffff) > 1) {
        break;
      }
      const p = ((ix[i - 4] * 2 + ix[i - 3]) * 2 + ix[i - 2]) * 2 + ix[i - 1];
      a1 += tables.t32l[p];
      a2 += tables.t33l[p];
    }
    let bits = a1;
    gi.count1table_select = 0;
    if (a1 > a2) {
      bits = a2;
      gi.count1table_select = 1;
    }

    gi.count1bits = bits;
    gi.big_values = i;
    if (i === 0) return bits;

    if (gi.block_type === SHORT_TYPE) {
      a1 = 3 * gfc.scalefac_band.s[3];
      if (a1 > gi.big_values) a1 = gi.big_values;
      a2 = gi.big_values;
    } else if (gi.block_type === NORM_TYPE) {
      assert(i <= 576);

      a1 = gfc.bv_scf[i - 2];
      gi.region0_count = gfc.bv_scf[i - 2];
      a2 = gfc.bv_scf[i - 1];
      gi.region1_count = gfc.bv_scf[i - 1];

      assert(a1 + a2 + 2 < SBPSY_l);
      a2 = gfc.scalefac_band.l[a1 + a2 + 2];
      a1 = gfc.scalefac_band.l[a1 + 1];
      if (a2 < i) {
        const bi = new Bits(bits);
        gi.table_select[2] = this.choose_table(ix, a2, i, bi);
        bits = bi.bits;
      }
    } else {
      gi.region0_count = 7;

      gi.region1_count = SBMAX_l - 1 - 7 - 1;
      a1 = gfc.scalefac_band.l[7 + 1];
      a2 = i;
      if (a1 > a2) {
        a1 = a2;
      }
    }

    a1 = Math.min(a1, i);
    a2 = Math.min(a2, i);

    assert(a1 >= 0);
    assert(a2 >= 0);

    if (a1 > 0) {
      const bi = new Bits(bits);
      gi.table_select[0] = this.choose_table(ix, 0, a1, bi);
      bits = bi.bits;
    }
    if (a1 < a2) {
      const bi = new Bits(bits);
      gi.table_select[1] = this.choose_table(ix, a1, a2, bi);
      bits = bi.bits;
    }
    if (gfc.use_best_huffman === 2) {
      gi.part2_3_length = bits;
      this.best_huffman_divide(gfc, gi);
      bits = gi.part2_3_length;
    }

    if (prev_noise !== null) {
      if (gi.block_type === NORM_TYPE) {
        let sfb = 0;
        while (gfc.scalefac_band.l[sfb] < gi.big_values) {
          sfb++;
        }
        prev_noise.sfb_count1 = sfb;
      }
    }

    return bits;
  }

  count_bits(
    gfc: LameInternalFlags,
    xr: Float32Array,
    gi: GrInfo,
    prev_noise: CalcNoiseData | null,
  ) {
    const ix = gi.l3_enc;

    const w = QuantizePVT.IXMAX_VAL / this.qupvt.ipow20(gi.global_gain);

    if (gi.xrpow_max > w) return Takehiro.LARGE_BITS;

    this.quantize_xrpow(
      xr,
      ix,
      this.qupvt.ipow20(gi.global_gain),
      gi,
      prev_noise,
    );

    if ((gfc.substep_shaping & 2) !== 0) {
      let j = 0;

      const gain = gi.global_gain + gi.scalefac_scale;
      const roundfac = 0.634521682242439 / this.qupvt.ipow20(gain);
      for (let sfb = 0; sfb < gi.sfbmax; sfb++) {
        const width = gi.width[sfb];
        assert(width >= 0);
        if (gfc.pseudohalf[sfb] === 0) {
          j += width;
        } else {
          let k;
          for (k = j, j += width; k < j; ++k) {
            ix[k] = xr[k] >= roundfac ? ix[k] : 0;
          }
        }
      }
    }
    return this.noquant_count_bits(gfc, gi, prev_noise);
  }

  private recalc_divide_init(
    gfc: LameInternalFlags,
    cod_info: GrInfo,
    ix: Int32Array,
    r01_bits: Int32Array,
    r01_div: Int32Array,
    r0_tbl: Int32Array,
    r1_tbl: Int32Array,
  ) {
    const bigv = cod_info.big_values;

    for (let r0 = 0; r0 <= 7 + 15; r0++) {
      r01_bits[r0] = Takehiro.LARGE_BITS;
    }

    for (let r0 = 0; r0 < 16; r0++) {
      const a1 = gfc.scalefac_band.l[r0 + 1];
      if (a1 >= bigv) break;
      let r0bits = 0;
      let bi = new Bits(r0bits);
      const r0t = this.choose_table(ix, 0, a1, bi);
      r0bits = bi.bits;

      for (let r1 = 0; r1 < 8; r1++) {
        const a2 = gfc.scalefac_band.l[r0 + r1 + 2];
        if (a2 >= bigv) break;
        let bits = r0bits;
        bi = new Bits(bits);
        const r1t = this.choose_table(ix, a1, a2, bi);
        bits = bi.bits;
        if (r01_bits[r0 + r1] > bits) {
          r01_bits[r0 + r1] = bits;
          r01_div[r0 + r1] = r0;
          r0_tbl[r0 + r1] = r0t;
          r1_tbl[r0 + r1] = r1t;
        }
      }
    }
  }

  private recalc_divide_sub(
    gfc: LameInternalFlags,
    cod_info2: GrInfo,
    gi: GrInfo,
    ix: Int32Array,
    r01_bits: Int32Array,
    r01_div: Int32Array,
    r0_tbl: Int32Array,
    r1_tbl: Int32Array,
  ) {
    const bigv = cod_info2.big_values;

    for (let r2 = 2; r2 < SBMAX_l + 1; r2++) {
      const a2 = gfc.scalefac_band.l[r2];
      if (a2 >= bigv) break;
      let bits = r01_bits[r2 - 2] + cod_info2.count1bits;
      if (gi.part2_3_length <= bits) break;

      const bi = new Bits(bits);
      const r2t = this.choose_table(ix, a2, bigv, bi);
      bits = bi.bits;
      if (gi.part2_3_length <= bits) continue;

      gi.assign(cod_info2);
      gi.part2_3_length = bits;
      gi.region0_count = r01_div[r2 - 2];
      gi.region1_count = r2 - 2 - r01_div[r2 - 2];
      gi.table_select[0] = r0_tbl[r2 - 2];
      gi.table_select[1] = r1_tbl[r2 - 2];
      gi.table_select[2] = r2t;
    }
  }

  best_huffman_divide(gfc: LameInternalFlags, gi: GrInfo) {
    const cod_info2 = new GrInfo();
    const ix = gi.l3_enc;
    const r01_bits = new Int32Array(7 + 15 + 1);
    const r01_div = new Int32Array(7 + 15 + 1);
    const r0_tbl = new Int32Array(7 + 15 + 1);
    const r1_tbl = new Int32Array(7 + 15 + 1);

    if (gi.block_type === SHORT_TYPE && gfc.mode_gr === 1) return;

    cod_info2.assign(gi);
    if (gi.block_type === NORM_TYPE) {
      this.recalc_divide_init(gfc, gi, ix, r01_bits, r01_div, r0_tbl, r1_tbl);
      this.recalc_divide_sub(
        gfc,
        cod_info2,
        gi,
        ix,
        r01_bits,
        r01_div,
        r0_tbl,
        r1_tbl,
      );
    }
    let i = cod_info2.big_values;
    if (i === 0 || (ix[i - 2] | ix[i - 1]) > 1) return;

    i = gi.count1 + 2;
    if (i > 576) return;

    cod_info2.assign(gi);
    cod_info2.count1 = i;
    let a1 = 0;
    let a2 = 0;

    assert(i <= 576);

    for (; i > cod_info2.big_values; i -= 4) {
      const p = ((ix[i - 4] * 2 + ix[i - 3]) * 2 + ix[i - 2]) * 2 + ix[i - 1];
      a1 += tables.t32l[p];
      a2 += tables.t33l[p];
    }
    cod_info2.big_values = i;

    cod_info2.count1table_select = 0;
    if (a1 > a2) {
      a1 = a2;
      cod_info2.count1table_select = 1;
    }

    cod_info2.count1bits = a1;

    if (cod_info2.block_type === NORM_TYPE) {
      this.recalc_divide_sub(
        gfc,
        cod_info2,
        gi,
        ix,
        r01_bits,
        r01_div,
        r0_tbl,
        r1_tbl,
      );
    } else {
      cod_info2.part2_3_length = a1;
      a1 = gfc.scalefac_band.l[7 + 1];
      if (a1 > i) {
        a1 = i;
      }
      if (a1 > 0) {
        const bi = new Bits(cod_info2.part2_3_length);
        cod_info2.table_select[0] = this.choose_table(ix, 0, a1, bi);
        cod_info2.part2_3_length = bi.bits;
      }
      if (i > a1) {
        const bi = new Bits(cod_info2.part2_3_length);
        cod_info2.table_select[1] = this.choose_table(ix, a1, i, bi);
        cod_info2.part2_3_length = bi.bits;
      }
      if (gi.part2_3_length > cod_info2.part2_3_length) gi.assign(cod_info2);
    }
  }

  static readonly slen1_tab = [
    0, 0, 0, 0, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4,
  ] as const;

  static readonly slen2_tab = [
    0, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3, 1, 2, 3, 2, 3,
  ] as const;

  private readonly slen1_n = [
    1, 1, 1, 1, 8, 2, 2, 2, 4, 4, 4, 8, 8, 8, 16, 16,
  ] as const;

  private readonly slen2_n = [
    1, 2, 4, 8, 1, 2, 4, 8, 2, 4, 8, 2, 4, 8, 4, 8,
  ] as const;

  private scfsi_calc(ch: number, l3_side: IIISideInfo) {
    let sfb;
    const gi = l3_side.tt[1][ch];
    const g0 = l3_side.tt[0][ch];

    for (let i = 0; i < this.scfsi_band.length - 1; i++) {
      for (sfb = this.scfsi_band[i]; sfb < this.scfsi_band[i + 1]; sfb++) {
        if (g0.scalefac[sfb] !== gi.scalefac[sfb] && gi.scalefac[sfb] >= 0)
          break;
      }
      if (sfb === this.scfsi_band[i + 1]) {
        for (sfb = this.scfsi_band[i]; sfb < this.scfsi_band[i + 1]; sfb++) {
          gi.scalefac[sfb] = -1;
        }
        l3_side.scfsi[ch][i] = 1;
      }
    }
    let s1 = 0;
    let c1 = 0;
    for (sfb = 0; sfb < 11; sfb++) {
      if (gi.scalefac[sfb] === -1) continue;
      c1++;
      if (s1 < gi.scalefac[sfb]) s1 = gi.scalefac[sfb];
    }
    let s2 = 0;
    let c2 = 0;
    for (; sfb < SBPSY_l; sfb++) {
      if (gi.scalefac[sfb] === -1) continue;
      c2++;
      if (s2 < gi.scalefac[sfb]) s2 = gi.scalefac[sfb];
    }

    for (let i = 0; i < 16; i++) {
      if (s1 < this.slen1_n[i] && s2 < this.slen2_n[i]) {
        const c = Takehiro.slen1_tab[i] * c1 + Takehiro.slen2_tab[i] * c2;
        if (gi.part2_length > c) {
          gi.part2_length = c;
          gi.scalefac_compress = i;
        }
      }
    }
  }

  best_scalefac_store(
    gfc: LameInternalFlags,
    gr: number,
    ch: number,
    l3_side: IIISideInfo,
  ) {
    const gi = l3_side.tt[gr][ch];
    let sfb;
    let i;
    let j;
    let l;
    let recalc = 0;

    j = 0;
    for (sfb = 0; sfb < gi.sfbmax; sfb++) {
      const width = gi.width[sfb];
      assert(width >= 0);
      j += width;
      for (l = -width; l < 0; l++) {
        if (gi.l3_enc[l + j] !== 0) break;
      }
      if (l === 0) {
        gi.scalefac[sfb] = -2;
        recalc = -2;
      }
    }

    if (gi.scalefac_scale === 0 && gi.preflag === 0) {
      let s = 0;
      for (sfb = 0; sfb < gi.sfbmax; sfb++)
        if (gi.scalefac[sfb] > 0) s |= gi.scalefac[sfb];

      if ((s & 1) === 0 && s !== 0) {
        for (sfb = 0; sfb < gi.sfbmax; sfb++) {
          if (gi.scalefac[sfb] > 0) {
            gi.scalefac[sfb] >>= 1;
          }
        }

        gi.scalefac_scale = 1;
        recalc = 1;
      }
    }

    if (gi.preflag === 0 && gi.block_type !== SHORT_TYPE && gfc.mode_gr === 2) {
      for (sfb = 11; sfb < SBPSY_l; sfb++)
        if (
          gi.scalefac[sfb] < this.qupvt.pretab[sfb] &&
          gi.scalefac[sfb] !== -2
        )
          break;
      if (sfb === SBPSY_l) {
        for (sfb = 11; sfb < SBPSY_l; sfb++)
          if (gi.scalefac[sfb] > 0) gi.scalefac[sfb] -= this.qupvt.pretab[sfb];

        gi.preflag = 1;
        recalc = 1;
      }
    }

    for (i = 0; i < 4; i++) {
      l3_side.scfsi[ch][i] = 0;
    }

    if (
      gfc.mode_gr === 2 &&
      gr === 1 &&
      l3_side.tt[0][ch].block_type !== SHORT_TYPE &&
      l3_side.tt[1][ch].block_type !== SHORT_TYPE
    ) {
      this.scfsi_calc(ch, l3_side);
      recalc = 0;
    }
    for (sfb = 0; sfb < gi.sfbmax; sfb++) {
      if (gi.scalefac[sfb] === -2) {
        gi.scalefac[sfb] = 0;
      }
    }
    if (recalc !== 0) {
      if (gfc.mode_gr === 2) {
        this.scale_bitcount(gi);
      } else {
        this.scale_bitcount_lsf(gfc, gi);
      }
    }
  }

  private all_scalefactors_not_negative(scalefac: Int32Array, n: number) {
    for (let i = 0; i < n; ++i) {
      if (scalefac[i] < 0) return false;
    }
    return true;
  }

  private readonly scale_short = [
    0, 18, 36, 54, 54, 36, 54, 72, 54, 72, 90, 72, 90, 108, 108, 126,
  ] as const;

  private readonly scale_mixed = [
    0, 18, 36, 54, 51, 35, 53, 71, 52, 70, 88, 69, 87, 105, 104, 122,
  ] as const;

  private readonly scale_long = [
    0, 10, 20, 30, 33, 21, 31, 41, 32, 42, 52, 43, 53, 63, 64, 74,
  ] as const;

  scale_bitcount(cod_info: GrInfo) {
    let k;
    let sfb;
    let max_slen1 = 0;
    let max_slen2 = 0;

    let tab;
    const { scalefac } = cod_info;

    assert(this.all_scalefactors_not_negative(scalefac, cod_info.sfbmax));

    if (cod_info.block_type === SHORT_TYPE) {
      tab = this.scale_short;
      if (cod_info.mixed_block_flag !== 0) tab = this.scale_mixed;
    } else {
      tab = this.scale_long;
      if (cod_info.preflag === 0) {
        for (sfb = 11; sfb < SBPSY_l; sfb++)
          if (scalefac[sfb] < this.qupvt.pretab[sfb]) break;

        if (sfb === SBPSY_l) {
          cod_info.preflag = 1;
          for (sfb = 11; sfb < SBPSY_l; sfb++)
            scalefac[sfb] -= this.qupvt.pretab[sfb];
        }
      }
    }

    for (sfb = 0; sfb < cod_info.sfbdivide; sfb++) {
      if (max_slen1 < scalefac[sfb]) {
        max_slen1 = scalefac[sfb];
      }
    }

    for (; sfb < cod_info.sfbmax; sfb++) {
      if (max_slen2 < scalefac[sfb]) {
        max_slen2 = scalefac[sfb];
      }
    }

    cod_info.part2_length = Takehiro.LARGE_BITS;
    for (k = 0; k < 16; k++) {
      if (
        max_slen1 < this.slen1_n[k] &&
        max_slen2 < this.slen2_n[k] &&
        cod_info.part2_length > tab[k]
      ) {
        cod_info.part2_length = tab[k];
        cod_info.scalefac_compress = k;
      }
    }
    return cod_info.part2_length === Takehiro.LARGE_BITS;
  }

  private readonly max_range_sfac_tab = [
    [15, 15, 7, 7],
    [15, 15, 7, 0],
    [7, 3, 0, 0],
    [15, 31, 31, 0],
    [7, 7, 7, 0],
    [3, 3, 0, 0],
  ] as const;

  private readonly log2tab = [
    0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4,
  ] as const;

  scale_bitcount_lsf(_gfc: LameInternalFlags, cod_info: GrInfo) {
    let table_number;
    let row_in_table;
    let partition;
    let nr_sfb;
    let window;
    let over;
    let i;
    let sfb;
    const max_sfac = new Int32Array(4);

    const { scalefac } = cod_info;

    if (cod_info.preflag !== 0) {
      table_number = 2;
    } else {
      table_number = 0;
    }

    for (i = 0; i < 4; i++) {
      max_sfac[i] = 0;
    }

    if (cod_info.block_type === SHORT_TYPE) {
      row_in_table = 1;
      const partition_table =
        this.qupvt.nr_of_sfb_block[table_number][row_in_table];
      for (sfb = 0, partition = 0; partition < 4; partition++) {
        nr_sfb = partition_table[partition] / 3;
        for (i = 0; i < nr_sfb; i++, sfb++) {
          for (window = 0; window < 3; window++) {
            if (scalefac[sfb * 3 + window] > max_sfac[partition]) {
              max_sfac[partition] = scalefac[sfb * 3 + window];
            }
          }
        }
      }
    } else {
      row_in_table = 0;
      const partition_table =
        this.qupvt.nr_of_sfb_block[table_number][row_in_table];
      for (sfb = 0, partition = 0; partition < 4; partition++) {
        nr_sfb = partition_table[partition];
        for (i = 0; i < nr_sfb; i++, sfb++) {
          if (scalefac[sfb] > max_sfac[partition]) {
            max_sfac[partition] = scalefac[sfb];
          }
        }
      }
    }

    for (over = false, partition = 0; partition < 4; partition++) {
      if (
        max_sfac[partition] > this.max_range_sfac_tab[table_number][partition]
      ) {
        over = true;
      }
    }
    if (!over) {
      cod_info.sfb_partition_table =
        this.qupvt.nr_of_sfb_block[table_number][row_in_table];
      for (partition = 0; partition < 4; partition++) {
        cod_info.slen[partition] = this.log2tab[max_sfac[partition]];
      }

      const slen1 = cod_info.slen[0];
      const slen2 = cod_info.slen[1];
      const slen3 = cod_info.slen[2];
      const slen4 = cod_info.slen[3];

      switch (table_number) {
        case 0:
          cod_info.scalefac_compress =
            ((slen1 * 5 + slen2) << 4) + (slen3 << 2) + slen4;
          break;

        case 1:
          cod_info.scalefac_compress = 400 + ((slen1 * 5 + slen2) << 2) + slen3;
          break;

        case 2:
          cod_info.scalefac_compress = 500 + slen1 * 3 + slen2;
          break;

        default:
          console.warn('intensity stereo not implemented yet');
          break;
      }
    }
    if (!over) {
      assert(cod_info.sfb_partition_table !== null);
      cod_info.part2_length = 0;
      for (partition = 0; partition < 4; partition++)
        cod_info.part2_length +=
          cod_info.slen[partition] * cod_info.sfb_partition_table[partition];
    }
    return over;
  }

  huffman_init(gfc: LameInternalFlags) {
    for (let i = 2; i <= 576; i += 2) {
      let scfb_anz = 0;
      let bv_index;
      while (gfc.scalefac_band.l[++scfb_anz] < i);

      bv_index = this.subdv_table[scfb_anz][0];
      while (gfc.scalefac_band.l[bv_index + 1] > i) bv_index--;

      if (bv_index < 0) {
        bv_index = this.subdv_table[scfb_anz][0];
      }

      gfc.bv_scf[i - 2] = bv_index;

      bv_index = this.subdv_table[scfb_anz][1];
      while (gfc.scalefac_band.l[bv_index + gfc.bv_scf[i - 2] + 2] > i)
        bv_index--;

      if (bv_index < 0) {
        bv_index = this.subdv_table[scfb_anz][1];
      }

      gfc.bv_scf[i - 1] = bv_index;
    }
  }
}
