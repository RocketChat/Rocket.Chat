import type { BitStream } from './BitStream';
import { CalcNoiseData } from './CalcNoiseData';
import { CalcNoiseResult } from './CalcNoiseResult';
import { GrInfo } from './GrInfo';
import type { IIISideInfo } from './IIISideInfo';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { LameInternalFlags } from './LameInternalFlags';
import { PsyModel } from './PsyModel';
import { QuantizePVT } from './QuantizePVT';
import { Reservoir } from './Reservoir';
import { StartLine } from './StartLine';
import { Takehiro } from './Takehiro';
import { VbrMode } from './VbrMode';
import { copyArray, fillArray, sortArray } from './arrays';
import { assert } from './assert';
import {
  PSFB12,
  PSFB21,
  SBMAX_l,
  SBMAX_s,
  SBPSY_l,
  SBPSY_s,
  SFBMAX,
  SHORT_TYPE,
} from './constants';
import { isCloseToEachOther } from './math';

export class Quantize {
  readonly rv: Reservoir;

  readonly qupvt: QuantizePVT;

  readonly tak: Takehiro;

  constructor(bs: BitStream) {
    this.rv = new Reservoir(bs);
    this.qupvt = new QuantizePVT(new PsyModel());
    this.tak = new Takehiro(this.qupvt);
  }

  ms_convert(l3_side: IIISideInfo, gr: number) {
    for (let i = 0; i < 576; ++i) {
      const l = l3_side.tt[gr][0].xr[i];
      const r = l3_side.tt[gr][1].xr[i];
      l3_side.tt[gr][0].xr[i] = (l + r) * (Math.SQRT2 * 0.5);
      l3_side.tt[gr][1].xr[i] = (l - r) * (Math.SQRT2 * 0.5);
    }
  }

  private init_xrpow_core(
    cod_info: GrInfo,
    xrpow: Float32Array,
    upper: number,
    sum: number,
  ) {
    sum = 0;
    for (let i = 0; i <= upper; ++i) {
      const tmp = Math.abs(cod_info.xr[i]);
      sum += tmp;
      xrpow[i] = Math.sqrt(tmp * Math.sqrt(tmp));

      if (xrpow[i] > cod_info.xrpow_max) cod_info.xrpow_max = xrpow[i];
    }
    return sum;
  }

  init_xrpow(gfc: LameInternalFlags, cod_info: GrInfo, xrpow: Float32Array) {
    let sum = 0;
    const upper = Math.trunc(cod_info.max_nonzero_coeff);

    assert(xrpow !== null);
    cod_info.xrpow_max = 0;

    assert(upper >= 0 && upper <= 575);

    fillArray(xrpow, upper, 576, 0);

    sum = this.init_xrpow_core(cod_info, xrpow, upper, sum);

    if (sum > 1e-20) {
      let j = 0;
      if ((gfc.substep_shaping & 2) !== 0) j = 1;

      for (let i = 0; i < cod_info.psymax; i++) gfc.pseudohalf[i] = j;

      return true;
    }

    fillArray(cod_info.l3_enc, 0, 576, 0);
    return false;
  }

  private psfb21_analogsilence(gfc: LameInternalFlags, cod_info: GrInfo) {
    const ath = gfc.ATH;
    const { xr } = cod_info;

    if (cod_info.block_type !== SHORT_TYPE) {
      let stop = false;
      for (let gsfb = PSFB21 - 1; gsfb >= 0 && !stop; gsfb--) {
        const start = gfc.scalefac_band.psfb21[gsfb];
        const end = gfc.scalefac_band.psfb21[gsfb + 1];
        let ath21 = this.qupvt.athAdjust(
          ath.adjust,
          ath.psfb21[gsfb],
          ath.floor,
        );

        if (gfc.nsPsy.longfact[21] > 1e-12) ath21 *= gfc.nsPsy.longfact[21];

        for (let j = end - 1; j >= start; j--) {
          if (Math.abs(xr[j]) < ath21) xr[j] = 0;
          else {
            stop = true;
            break;
          }
        }
      }
    } else {
      for (let block = 0; block < 3; block++) {
        let stop = false;
        for (let gsfb = PSFB12 - 1; gsfb >= 0 && !stop; gsfb--) {
          const start =
            gfc.scalefac_band.s[12] * 3 +
            (gfc.scalefac_band.s[13] - gfc.scalefac_band.s[12]) * block +
            (gfc.scalefac_band.psfb12[gsfb] - gfc.scalefac_band.psfb12[0]);
          const end =
            start +
            (gfc.scalefac_band.psfb12[gsfb + 1] -
              gfc.scalefac_band.psfb12[gsfb]);
          let ath12 = this.qupvt.athAdjust(
            ath.adjust,
            ath.psfb12[gsfb],
            ath.floor,
          );

          if (gfc.nsPsy.shortfact[12] > 1e-12) ath12 *= gfc.nsPsy.shortfact[12];

          for (let j = end - 1; j >= start; j--) {
            if (Math.abs(xr[j]) < ath12) xr[j] = 0;
            else {
              stop = true;
              break;
            }
          }
        }
      }
    }
  }

  init_outer_loop(gfc: LameInternalFlags, cod_info: GrInfo) {
    cod_info.part2_3_length = 0;
    cod_info.big_values = 0;
    cod_info.count1 = 0;
    cod_info.global_gain = 210;
    cod_info.scalefac_compress = 0;

    cod_info.table_select[0] = 0;
    cod_info.table_select[1] = 0;
    cod_info.table_select[2] = 0;
    cod_info.subblock_gain[0] = 0;
    cod_info.subblock_gain[1] = 0;
    cod_info.subblock_gain[2] = 0;
    cod_info.subblock_gain[3] = 0;

    cod_info.region0_count = 0;
    cod_info.region1_count = 0;
    cod_info.preflag = 0;
    cod_info.scalefac_scale = 0;
    cod_info.count1table_select = 0;
    cod_info.part2_length = 0;
    cod_info.sfb_lmax = SBPSY_l;
    cod_info.sfb_smin = SBPSY_s;
    cod_info.psy_lmax = gfc.sfb21_extra ? SBMAX_l : SBPSY_l;
    cod_info.psymax = cod_info.psy_lmax;
    cod_info.sfbmax = cod_info.sfb_lmax;
    cod_info.sfbdivide = 11;
    for (let sfb = 0; sfb < SBMAX_l; sfb++) {
      cod_info.width[sfb] =
        gfc.scalefac_band.l[sfb + 1] - gfc.scalefac_band.l[sfb];

      cod_info.window[sfb] = 3;
    }
    if (cod_info.block_type === SHORT_TYPE) {
      const ixwork = new Float32Array(576);

      cod_info.sfb_smin = 0;
      cod_info.sfb_lmax = 0;
      if (cod_info.mixed_block_flag !== 0) {
        cod_info.sfb_smin = 3;
        cod_info.sfb_lmax = gfc.mode_gr * 2 + 4;
      }
      cod_info.psymax =
        cod_info.sfb_lmax +
        3 * ((gfc.sfb21_extra ? SBMAX_s : SBPSY_s) - cod_info.sfb_smin);
      cod_info.sfbmax = cod_info.sfb_lmax + 3 * (SBPSY_s - cod_info.sfb_smin);
      cod_info.sfbdivide = cod_info.sfbmax - 18;
      cod_info.psy_lmax = cod_info.sfb_lmax;

      let ix = gfc.scalefac_band.l[cod_info.sfb_lmax];
      copyArray(cod_info.xr, 0, ixwork, 0, 576);
      for (let sfb = cod_info.sfb_smin; sfb < SBMAX_s; sfb++) {
        const start = gfc.scalefac_band.s[sfb];
        const end = gfc.scalefac_band.s[sfb + 1];
        for (let window = 0; window < 3; window++) {
          for (let l = start; l < end; l++) {
            cod_info.xr[ix++] = ixwork[3 * l + window];
          }
        }
      }

      let j = cod_info.sfb_lmax;
      for (let sfb = cod_info.sfb_smin; sfb < SBMAX_s; sfb++) {
        const y = gfc.scalefac_band.s[sfb + 1] - gfc.scalefac_band.s[sfb];
        cod_info.width[j] = y;
        cod_info.width[j + 1] = y;
        cod_info.width[j + 2] = y;
        cod_info.window[j] = 0;
        cod_info.window[j + 1] = 1;
        cod_info.window[j + 2] = 2;
        j += 3;
      }
    }

    cod_info.count1bits = 0;
    cod_info.sfb_partition_table = this.qupvt.nr_of_sfb_block[0][0];
    cod_info.slen[0] = 0;
    cod_info.slen[1] = 0;
    cod_info.slen[2] = 0;
    cod_info.slen[3] = 0;

    cod_info.max_nonzero_coeff = 575;

    fillArray(cod_info.scalefac, 0);

    this.psfb21_analogsilence(gfc, cod_info);
  }

  private bin_search_StepSize(
    gfc: LameInternalFlags,
    cod_info: GrInfo,
    desired_rate: number,
    ch: number,
    xrpow: Float32Array,
  ) {
    const enum BinSearchDirection {
      BINSEARCH_NONE,
      BINSEARCH_UP,
      BINSEARCH_DOWN,
    }

    let nBits;
    let CurrentStep = gfc.currentStep[ch];
    let flagGoneOver = false;
    const start = gfc.oldValue[ch];
    let direction = BinSearchDirection.BINSEARCH_NONE;
    cod_info.global_gain = start;
    desired_rate -= cod_info.part2_length;

    assert(CurrentStep !== 0);
    for (;;) {
      let step;
      nBits = this.tak.count_bits(gfc, xrpow, cod_info, null);

      if (CurrentStep === 1 || nBits === desired_rate) break;

      if (nBits > desired_rate) {
        if (direction === BinSearchDirection.BINSEARCH_DOWN)
          flagGoneOver = true;

        if (flagGoneOver) CurrentStep /= 2;
        direction = BinSearchDirection.BINSEARCH_UP;
        step = CurrentStep;
      } else {
        if (direction === BinSearchDirection.BINSEARCH_UP) flagGoneOver = true;

        if (flagGoneOver) CurrentStep /= 2;
        direction = BinSearchDirection.BINSEARCH_DOWN;
        step = -CurrentStep;
      }
      cod_info.global_gain += step;
      if (cod_info.global_gain < 0) {
        cod_info.global_gain = 0;
        flagGoneOver = true;
      }
      if (cod_info.global_gain > 255) {
        cod_info.global_gain = 255;
        flagGoneOver = true;
      }
    }

    assert(cod_info.global_gain >= 0);
    assert(cod_info.global_gain < 256);

    while (nBits > desired_rate && cod_info.global_gain < 255) {
      cod_info.global_gain++;
      nBits = this.tak.count_bits(gfc, xrpow, cod_info, null);
    }
    gfc.currentStep[ch] = start - cod_info.global_gain >= 4 ? 4 : 2;
    gfc.oldValue[ch] = cod_info.global_gain;
    cod_info.part2_3_length = nBits;
    return nBits;
  }

  trancate_smallspectrums(
    gfc: LameInternalFlags,
    gi: GrInfo,
    l3_xmin: Float32Array,
    work: Float32Array,
  ) {
    const distort = new Float32Array(SFBMAX);

    if (
      ((gfc.substep_shaping & 4) === 0 && gi.block_type === SHORT_TYPE) ||
      (gfc.substep_shaping & 0x80) !== 0
    )
      return;
    this.calc_noise(gi, l3_xmin, distort, new CalcNoiseResult(), null);
    for (let j = 0; j < 576; j++) {
      let xr = 0.0;
      if (gi.l3_enc[j] !== 0) xr = Math.abs(gi.xr[j]);
      work[j] = xr;
    }

    let j = 0;
    let sfb = 8;
    if (gi.block_type === SHORT_TYPE) sfb = 6;
    do {
      let allowedNoise;
      let trancateThreshold;
      let nsame;
      let start;

      let width = gi.width[sfb];
      j += width;
      if (distort[sfb] >= 1.0) continue;

      sortArray(work, j - width, width);
      if (isCloseToEachOther(work[j - 1], 0.0)) continue;

      allowedNoise = (1.0 - distort[sfb]) * l3_xmin[sfb];
      trancateThreshold = 0.0;
      start = 0;
      do {
        for (nsame = 1; start + nsame < width; nsame++)
          if (
            !isCloseToEachOther(
              work[start + j - width],
              work[start + j + nsame - width],
            )
          )
            break;

        const noise = work[start + j - width] * work[start + j - width] * nsame;
        if (allowedNoise < noise) {
          if (start !== 0) trancateThreshold = work[start + j - width - 1];
          break;
        }
        allowedNoise -= noise;
        start += nsame;
      } while (start < width);
      if (isCloseToEachOther(trancateThreshold, 0.0)) continue;

      do {
        if (Math.abs(gi.xr[j - width]) <= trancateThreshold)
          gi.l3_enc[j - width] = 0;
      } while (--width > 0);
    } while (++sfb < gi.psymax);

    gi.part2_3_length = this.tak.noquant_count_bits(gfc, gi, null);
  }

  private loop_break(cod_info: GrInfo) {
    for (let sfb = 0; sfb < cod_info.sfbmax; sfb++)
      if (
        cod_info.scalefac[sfb] +
          cod_info.subblock_gain[cod_info.window[sfb]] ===
        0
      )
        return false;

    return true;
  }

  private penalties(noise: number) {
    return Math.log10(0.368 + 0.632 * noise * noise * noise);
  }

  private get_klemm_noise(distort: Float32Array, gi: GrInfo) {
    let klemm_noise = 1e-37;
    for (let sfb = 0; sfb < gi.psymax; sfb++)
      klemm_noise += this.penalties(distort[sfb]);

    return Math.max(1e-20, klemm_noise);
  }

  // eslint-disable-next-line complexity
  private quant_compare(
    quant_comp: number,
    best: CalcNoiseResult,
    calc: CalcNoiseResult,
    gi: GrInfo,
    distort: Float32Array,
  ) {
    let better;

    switch (quant_comp) {
      default:
      case 9: {
        if (best.over_count > 0) {
          better = calc.over_SSD <= best.over_SSD;
          if (calc.over_SSD === best.over_SSD) better = calc.bits < best.bits;
        } else {
          better =
            calc.max_noise < 0 &&
            calc.max_noise * 10 + calc.bits <= best.max_noise * 10 + best.bits;
        }
        break;
      }

      case 0:
        better =
          calc.over_count < best.over_count ||
          (calc.over_count === best.over_count &&
            calc.over_noise < best.over_noise) ||
          (calc.over_count === best.over_count &&
            isCloseToEachOther(calc.over_noise, best.over_noise) &&
            calc.tot_noise < best.tot_noise);
        break;

      case 8:
        calc.max_noise = this.get_klemm_noise(distort, gi);

      // eslint-disable-next-line no-fallthrough
      case 1:
        better = calc.max_noise < best.max_noise;
        break;
      case 2:
        better = calc.tot_noise < best.tot_noise;
        break;
      case 3:
        better =
          calc.tot_noise < best.tot_noise && calc.max_noise < best.max_noise;
        break;
      case 4:
        better =
          (calc.max_noise <= 0.0 && best.max_noise > 0.2) ||
          (calc.max_noise <= 0.0 &&
            best.max_noise < 0.0 &&
            best.max_noise > calc.max_noise - 0.2 &&
            calc.tot_noise < best.tot_noise) ||
          (calc.max_noise <= 0.0 &&
            best.max_noise > 0.0 &&
            best.max_noise > calc.max_noise - 0.2 &&
            calc.tot_noise < best.tot_noise + best.over_noise) ||
          (calc.max_noise > 0.0 &&
            best.max_noise > -0.05 &&
            best.max_noise > calc.max_noise - 0.1 &&
            calc.tot_noise + calc.over_noise <
              best.tot_noise + best.over_noise) ||
          (calc.max_noise > 0.0 &&
            best.max_noise > -0.1 &&
            best.max_noise > calc.max_noise - 0.15 &&
            calc.tot_noise + calc.over_noise + calc.over_noise <
              best.tot_noise + best.over_noise + best.over_noise);
        break;
      case 5:
        better =
          calc.over_noise < best.over_noise ||
          (isCloseToEachOther(calc.over_noise, best.over_noise) &&
            calc.tot_noise < best.tot_noise);
        break;
      case 6:
        better =
          calc.over_noise < best.over_noise ||
          (isCloseToEachOther(calc.over_noise, best.over_noise) &&
            (calc.max_noise < best.max_noise ||
              (isCloseToEachOther(calc.max_noise, best.max_noise) &&
                calc.tot_noise <= best.tot_noise)));
        break;
      case 7:
        better =
          calc.over_count < best.over_count ||
          calc.over_noise < best.over_noise;
        break;
    }

    if (best.over_count === 0) {
      better = better && calc.bits < best.bits;
    }

    return better;
  }

  private amp_scalefac_bands(
    gfp: LameGlobalFlags,
    cod_info: GrInfo,
    distort: Float32Array,
    xrpow: Float32Array,
    bRefine: boolean,
  ) {
    const gfc = gfp.internal_flags;
    let ifqstep34;

    if (cod_info.scalefac_scale === 0) {
      ifqstep34 = 1.29683955465100964055;
    } else {
      ifqstep34 = 1.68179283050742922612;
    }

    let trigger = 0;
    for (let sfb = 0; sfb < cod_info.sfbmax; sfb++) {
      if (trigger < distort[sfb]) trigger = distort[sfb];
    }

    let { noise_shaping_amp } = gfc;
    if (noise_shaping_amp === 3) {
      if (bRefine) noise_shaping_amp = 2;
      else noise_shaping_amp = 1;
    }
    switch (noise_shaping_amp) {
      case 2:
        break;

      case 1:
        if (trigger > 1.0) trigger = Math.pow(trigger, 0.5);
        else trigger *= 0.95;
        break;

      case 0:
      default:
        if (trigger > 1.0) trigger = 1.0;
        else trigger *= 0.95;
        break;
    }

    let j = 0;
    for (let sfb = 0; sfb < cod_info.sfbmax; sfb++) {
      const width = cod_info.width[sfb];
      let l;
      j += width;
      if (distort[sfb] < trigger) continue;

      if ((gfc.substep_shaping & 2) !== 0) {
        gfc.pseudohalf[sfb] = gfc.pseudohalf[sfb] === 0 ? 1 : 0;
        if (gfc.pseudohalf[sfb] === 0 && gfc.noise_shaping_amp === 2) return;
      }
      cod_info.scalefac[sfb]++;
      for (l = -width; l < 0; l++) {
        xrpow[j + l] *= ifqstep34;
        if (xrpow[j + l] > cod_info.xrpow_max)
          cod_info.xrpow_max = xrpow[j + l];
      }

      if (gfc.noise_shaping_amp === 2) return;
    }
  }

  private inc_scalefac_scale(cod_info: GrInfo, xrpow: Float32Array) {
    const ifqstep34 = 1.29683955465100964055;

    let j = 0;
    for (let sfb = 0; sfb < cod_info.sfbmax; sfb++) {
      const width = cod_info.width[sfb];
      let s = cod_info.scalefac[sfb];
      if (cod_info.preflag !== 0) s += this.qupvt.pretab[sfb];
      j += width;
      if ((s & 1) !== 0) {
        s++;
        for (let l = -width; l < 0; l++) {
          xrpow[j + l] *= ifqstep34;
          if (xrpow[j + l] > cod_info.xrpow_max)
            cod_info.xrpow_max = xrpow[j + l];
        }
      }
      cod_info.scalefac[sfb] = s >> 1;
    }
    cod_info.preflag = 0;
    cod_info.scalefac_scale = 1;
  }

  private inc_subblock_gain(
    gfc: LameInternalFlags,
    cod_info: GrInfo,
    xrpow: Float32Array,
  ) {
    let sfb;
    const { scalefac } = cod_info;

    for (sfb = 0; sfb < cod_info.sfb_lmax; sfb++) {
      if (scalefac[sfb] >= 16) return true;
    }

    for (let window = 0; window < 3; window++) {
      let s1 = 0;
      let s2 = 0;

      for (
        sfb = cod_info.sfb_lmax + window;
        sfb < cod_info.sfbdivide;
        sfb += 3
      ) {
        if (s1 < scalefac[sfb]) s1 = scalefac[sfb];
      }
      for (; sfb < cod_info.sfbmax; sfb += 3) {
        if (s2 < scalefac[sfb]) s2 = scalefac[sfb];
      }

      if (s1 < 16 && s2 < 8) continue;

      if (cod_info.subblock_gain[window] >= 7) return true;

      cod_info.subblock_gain[window]++;
      let j = gfc.scalefac_band.l[cod_info.sfb_lmax];
      for (sfb = cod_info.sfb_lmax + window; sfb < cod_info.sfbmax; sfb += 3) {
        let amp;
        const width = cod_info.width[sfb];
        let s = scalefac[sfb];
        assert(s >= 0);
        s -= 4 >> cod_info.scalefac_scale;
        if (s >= 0) {
          scalefac[sfb] = s;
          j += width * 3;
          continue;
        }

        scalefac[sfb] = 0;
        {
          const gain = 210 + (s << (cod_info.scalefac_scale + 1));
          amp = this.qupvt.ipow20(gain);
        }
        j += width * (window + 1);
        for (let l = -width; l < 0; l++) {
          xrpow[j + l] *= amp;
          if (xrpow[j + l] > cod_info.xrpow_max)
            cod_info.xrpow_max = xrpow[j + l];
        }
        j += width * (3 - window - 1);
      }

      const amp = this.qupvt.ipow20(202);
      j += cod_info.width[sfb] * (window + 1);
      for (let l = -cod_info.width[sfb]; l < 0; l++) {
        xrpow[j + l] *= amp;
        if (xrpow[j + l] > cod_info.xrpow_max)
          cod_info.xrpow_max = xrpow[j + l];
      }
    }
    return false;
  }

  private balance_noise(
    gfp: LameGlobalFlags,
    cod_info: GrInfo,
    distort: Float32Array,
    xrpow: Float32Array,
    bRefine: boolean,
  ) {
    const gfc = gfp.internal_flags;

    this.amp_scalefac_bands(gfp, cod_info, distort, xrpow, bRefine);

    let status = this.loop_break(cod_info);

    if (status) return false;

    if (gfc.mode_gr === 2) status = this.tak.scale_bitcount(cod_info);
    else status = this.tak.scale_bitcount_lsf(gfc, cod_info);

    if (!status) return true;

    if (gfc.noise_shaping > 1) {
      fillArray(gfc.pseudohalf, 0);
      if (cod_info.scalefac_scale === 0) {
        this.inc_scalefac_scale(cod_info, xrpow);
        status = false;
      } else if (cod_info.block_type === SHORT_TYPE && gfc.subblock_gain > 0) {
        status =
          this.inc_subblock_gain(gfc, cod_info, xrpow) ||
          this.loop_break(cod_info);
      }
    }

    if (!status) {
      if (gfc.mode_gr === 2) status = this.tak.scale_bitcount(cod_info);
      else status = this.tak.scale_bitcount_lsf(gfc, cod_info);
    }
    return !status;
  }

  // eslint-disable-next-line complexity
  outer_loop(
    gfp: LameGlobalFlags,
    cod_info: GrInfo,
    l3_xmin: Float32Array,
    xrpow: Float32Array,
    ch: number,
    targ_bits: number,
  ) {
    const gfc = gfp.internal_flags;
    const cod_info_w = new GrInfo();
    const save_xrpow = new Float32Array(576);
    const distort = new Float32Array(SFBMAX);
    let best_noise_info = new CalcNoiseResult();
    let better;
    const prev_noise = new CalcNoiseData();
    let best_part2_3_length = 9999999;
    let bEndOfSearch = false;
    let bRefine = false;
    let best_ggain_pass1 = 0;

    this.bin_search_StepSize(gfc, cod_info, targ_bits, ch, xrpow);

    if (gfc.noise_shaping === 0) {
      return 100;
    }

    this.calc_noise(cod_info, l3_xmin, distort, best_noise_info, prev_noise);
    best_noise_info.bits = cod_info.part2_3_length;

    cod_info_w.assign(cod_info);
    let age = 0;
    copyArray(xrpow, 0, save_xrpow, 0, 576);

    while (!bEndOfSearch) {
      do {
        const noise_info = new CalcNoiseResult();
        let search_limit;
        let maxggain = 255;

        if ((gfc.substep_shaping & 2) !== 0) {
          search_limit = 20;
        } else {
          search_limit = 3;
        }

        if (gfc.sfb21_extra) {
          if (distort[cod_info_w.sfbmax] > 1.0) break;
          if (
            cod_info_w.block_type === SHORT_TYPE &&
            (distort[cod_info_w.sfbmax + 1] > 1.0 ||
              distort[cod_info_w.sfbmax + 2] > 1.0)
          )
            break;
        }

        if (!this.balance_noise(gfp, cod_info_w, distort, xrpow, bRefine))
          break;
        if (cod_info_w.scalefac_scale !== 0) maxggain = 254;

        const huff_bits = targ_bits - cod_info_w.part2_length;
        if (huff_bits <= 0) break;

        while (
          (cod_info_w.part2_3_length = this.tak.count_bits(
            gfc,
            xrpow,
            cod_info_w,
            prev_noise,
          )) > huff_bits &&
          cod_info_w.global_gain <= maxggain
        )
          cod_info_w.global_gain++;

        if (cod_info_w.global_gain > maxggain) break;

        if (best_noise_info.over_count === 0) {
          while (
            (cod_info_w.part2_3_length = this.tak.count_bits(
              gfc,
              xrpow,
              cod_info_w,
              prev_noise,
            )) > best_part2_3_length &&
            cod_info_w.global_gain <= maxggain
          )
            cod_info_w.global_gain++;

          if (cod_info_w.global_gain > maxggain) break;
        }

        this.calc_noise(cod_info_w, l3_xmin, distort, noise_info, prev_noise);
        noise_info.bits = cod_info_w.part2_3_length;

        if (cod_info.block_type !== SHORT_TYPE) {
          better = gfp.quant_comp;
        } else better = gfp.quant_comp_short;

        better = this.quant_compare(
          better,
          best_noise_info,
          noise_info,
          cod_info_w,
          distort,
        )
          ? 1
          : 0;

        if (better !== 0) {
          best_part2_3_length = cod_info.part2_3_length;
          best_noise_info = noise_info;
          cod_info.assign(cod_info_w);
          age = 0;

          copyArray(xrpow, 0, save_xrpow, 0, 576);
        } else if (gfc.full_outer_loop === 0) {
          if (++age > search_limit && best_noise_info.over_count === 0) break;
          if (gfc.noise_shaping_amp === 3 && bRefine && age > 30) break;
          if (
            gfc.noise_shaping_amp === 3 &&
            bRefine &&
            cod_info_w.global_gain - best_ggain_pass1 > 15
          )
            break;
        }
      } while (cod_info_w.global_gain + cod_info_w.scalefac_scale < 255);

      if (gfc.noise_shaping_amp === 3) {
        if (!bRefine) {
          cod_info_w.assign(cod_info);
          copyArray(save_xrpow, 0, xrpow, 0, 576);
          age = 0;
          best_ggain_pass1 = cod_info_w.global_gain;

          bRefine = true;
        } else {
          bEndOfSearch = true;
        }
      } else {
        bEndOfSearch = true;
      }
    }

    assert(cod_info.global_gain + cod_info.scalefac_scale <= 255);

    if (gfp.VBR === VbrMode.vbr_rh || gfp.VBR === VbrMode.vbr_mtrh) {
      copyArray(save_xrpow, 0, xrpow, 0, 576);
    } else if ((gfc.substep_shaping & 1) !== 0) {
      this.trancate_smallspectrums(gfc, cod_info, l3_xmin, xrpow);
    }

    return best_noise_info.over_count;
  }

  iteration_finish_one(gfc: LameInternalFlags, gr: number, ch: number) {
    const { l3_side } = gfc;
    const cod_info = l3_side.tt[gr][ch];

    this.tak.best_scalefac_store(gfc, gr, ch, l3_side);

    if (gfc.use_best_huffman === 1) this.tak.best_huffman_divide(gfc, cod_info);

    this.rv.ResvAdjust(gfc, cod_info);
  }

  private _pow20: Float32Array | undefined;

  private pow20(x: number) {
    assert(x + QuantizePVT.Q_MAX2 >= 0 && x < QuantizePVT.Q_MAX);

    if (this._pow20 === undefined) {
      this._pow20 = new Float32Array(
        QuantizePVT.Q_MAX + QuantizePVT.Q_MAX2 + 1,
      );
      for (let i = 0; i <= QuantizePVT.Q_MAX + QuantizePVT.Q_MAX2; i++) {
        this._pow20[i] = Math.pow(2.0, (i - 210 - QuantizePVT.Q_MAX2) * 0.25);
      }
    }

    return this._pow20[x + QuantizePVT.Q_MAX2];
  }

  private calc_noise_core(
    cod_info: GrInfo,
    startline: StartLine,
    l: number,
    step: number,
  ) {
    let noise = 0;
    let j = startline.s;
    const ix = cod_info.l3_enc;

    if (j > cod_info.count1) {
      while (l-- !== 0) {
        let temp;
        temp = cod_info.xr[j];
        j++;
        noise += temp * temp;
        temp = cod_info.xr[j];
        j++;
        noise += temp * temp;
      }
    } else if (j > cod_info.big_values) {
      const ix01 = new Float32Array(2);
      ix01[0] = 0;
      ix01[1] = step;
      while (l-- !== 0) {
        let temp;
        temp = Math.abs(cod_info.xr[j]) - ix01[ix[j]];
        j++;
        noise += temp * temp;
        temp = Math.abs(cod_info.xr[j]) - ix01[ix[j]];
        j++;
        noise += temp * temp;
      }
    } else {
      while (l-- !== 0) {
        let temp;
        temp = Math.abs(cod_info.xr[j]) - this.qupvt.pow43(ix[j]) * step;
        j++;
        noise += temp * temp;
        temp = Math.abs(cod_info.xr[j]) - this.qupvt.pow43(ix[j]) * step;
        j++;
        noise += temp * temp;
      }
    }

    startline.s = j;
    return noise;
  }

  private calc_noise(
    cod_info: GrInfo,
    l3_xmin: Float32Array,
    distort: Float32Array,
    res: CalcNoiseResult,
    prev_noise: CalcNoiseData | null,
  ) {
    let distortPos = 0;
    let l3_xminPos = 0;
    let sfb;
    let l;
    let over = 0;
    let over_noise_db = 0;

    let tot_noise_db = 0;

    let max_noise = -20.0;
    let j = 0;
    const { scalefac } = cod_info;
    let scalefacPos = 0;

    res.over_SSD = 0;

    for (sfb = 0; sfb < cod_info.psymax; sfb++) {
      const s =
        cod_info.global_gain -
        ((scalefac[scalefacPos++] +
          (cod_info.preflag !== 0 ? this.qupvt.pretab[sfb] : 0)) <<
          (cod_info.scalefac_scale + 1)) -
        cod_info.subblock_gain[cod_info.window[sfb]] * 8;
      let noise = 0.0;

      if (prev_noise !== null && prev_noise.step[sfb] === s) {
        noise = prev_noise.noise[sfb];
        j += cod_info.width[sfb];
        distort[distortPos++] = noise / l3_xmin[l3_xminPos++];

        noise = prev_noise.noise_log[sfb];
      } else {
        const step = this.pow20(s);
        l = cod_info.width[sfb] >> 1;

        if (j + cod_info.width[sfb] > cod_info.max_nonzero_coeff) {
          const usefullsize = cod_info.max_nonzero_coeff - j + 1;

          if (usefullsize > 0) l = usefullsize >> 1;
          else l = 0;
        }

        const sl = new StartLine(j);
        noise = this.calc_noise_core(cod_info, sl, l, step);
        j = sl.s;

        if (prev_noise !== null) {
          prev_noise.step[sfb] = s;
          prev_noise.noise[sfb] = noise;
        }

        noise /= l3_xmin[l3_xminPos++];
        distort[distortPos++] = noise;

        noise = Math.log10(Math.max(noise, 1e-20));

        if (prev_noise !== null) {
          prev_noise.noise_log[sfb] = noise;
        }
      }

      if (prev_noise !== null) {
        prev_noise.global_gain = cod_info.global_gain;
      }

      tot_noise_db += noise;

      if (noise > 0.0) {
        const tmp = Math.max(Math.trunc(noise * 10 + 0.5), 1);
        res.over_SSD += tmp * tmp;

        over++;

        over_noise_db += noise;
      }
      max_noise = Math.max(max_noise, noise);
    }

    res.over_count = over;
    res.tot_noise = tot_noise_db;
    res.over_noise = over_noise_db;
    res.max_noise = max_noise;

    return over;
  }
}
