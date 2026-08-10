import type { GrInfo } from './GrInfo';
import type { III_psy_ratio } from './III_psy_ratio';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { PsyModel } from './PsyModel';
import type { Takehiro } from './Takehiro';
import { VbrMode } from './VbrMode';
import { assert } from './assert';
import {
  MAX_BITS_PER_CHANNEL,
  MAX_BITS_PER_GRANULE,
  MAX_FLOAT32_VALUE,
  PSFB12,
  PSFB21,
  SBMAX_l,
  SBMAX_s,
  SBPSY_l,
  SBPSY_s,
  SHORT_TYPE,
} from './constants';
import { isCloseToEachOther } from './math';

export class QuantizePVT {
  static Q_MAX = 256 + 1;

  static Q_MAX2 = 116;

  static IXMAX_VAL = 8206;

  readonly psy: PsyModel;

  constructor(psy: PsyModel) {
    this.psy = psy;
  }

  private static readonly DBL_EPSILON = 2.2204460492503131e-16;

  static readonly PRECALC_SIZE = QuantizePVT.IXMAX_VAL + 2;

  private static readonly NSATHSCALE = 100;

  readonly nr_of_sfb_block = [
    [
      [6, 5, 5, 5],
      [9, 9, 9, 9],
      [6, 9, 9, 9],
    ],
    [
      [6, 5, 7, 3],
      [9, 9, 12, 6],
      [6, 9, 12, 6],
    ],
    [
      [11, 10, 0, 0],
      [18, 18, 0, 0],
      [15, 18, 0, 0],
    ],
    [
      [7, 7, 7, 0],
      [12, 12, 12, 0],
      [6, 15, 12, 0],
    ],
    [
      [6, 6, 6, 3],
      [12, 9, 9, 6],
      [6, 12, 9, 6],
    ],
    [
      [8, 8, 5, 0],
      [15, 12, 9, 0],
      [6, 18, 9, 0],
    ],
  ] as const;

  private _ipow20: Float32Array | undefined;

  ipow20(x: number) {
    assert(x >= 0 && x < QuantizePVT.Q_MAX);

    if (this._ipow20 === undefined) {
      this._ipow20 = new Float32Array(QuantizePVT.Q_MAX);
      for (let i = 0; i < QuantizePVT.Q_MAX; i++) {
        this._ipow20[i] = Math.pow(2.0, (i - 210) * -0.1875);
      }
    }

    return this._ipow20[x];
  }

  private _pow43: Float32Array | undefined;

  pow43(k: number) {
    if (this._pow43 === undefined) {
      this._pow43 = new Float32Array(QuantizePVT.PRECALC_SIZE);
      this._pow43[0] = 0.0;
      for (let i = 1; i < QuantizePVT.PRECALC_SIZE; i++) {
        this._pow43[i] = Math.pow(i, 4.0 / 3.0);
      }
    }

    return this._pow43[k];
  }

  _adj43: Float32Array | undefined;

  adj43(k: number) {
    if (this._adj43 === undefined) {
      this._adj43 = new Float32Array(QuantizePVT.PRECALC_SIZE);

      let i;
      for (i = 0; i < QuantizePVT.PRECALC_SIZE - 1; i++) {
        this._adj43[i] =
          i + 1 - Math.pow(0.5 * (this.pow43(i) + this.pow43(i + 1)), 0.75);
      }
      this._adj43[i] = 0.5;
    }
    return this._adj43[k];
  }

  private ATHmdct(gfp: LameGlobalFlags, f: number) {
    let ath = this.psy.ATHformula(f, gfp);

    ath -= QuantizePVT.NSATHSCALE;

    ath = Math.pow(10.0, ath / 10.0 + gfp.ATHlower);
    return ath;
  }

  private compute_ath(gfp: LameGlobalFlags) {
    const ATH_l = gfp.internal_flags.ATH.l;
    const ATH_psfb21 = gfp.internal_flags.ATH.psfb21;
    const ATH_s = gfp.internal_flags.ATH.s;
    const ATH_psfb12 = gfp.internal_flags.ATH.psfb12;
    const gfc = gfp.internal_flags;
    const samp_freq = gfp.out_samplerate;

    for (let sfb = 0; sfb < SBMAX_l; sfb++) {
      const start = gfc.scalefac_band.l[sfb];
      const end = gfc.scalefac_band.l[sfb + 1];
      ATH_l[sfb] = MAX_FLOAT32_VALUE;
      for (let i = start; i < end; i++) {
        const freq = (i * samp_freq) / (2 * 576);
        const ATH_f = this.ATHmdct(gfp, freq);

        ATH_l[sfb] = Math.min(ATH_l[sfb], ATH_f);
      }
    }

    for (let sfb = 0; sfb < PSFB21; sfb++) {
      const start = gfc.scalefac_band.psfb21[sfb];
      const end = gfc.scalefac_band.psfb21[sfb + 1];
      ATH_psfb21[sfb] = MAX_FLOAT32_VALUE;
      for (let i = start; i < end; i++) {
        const freq = (i * samp_freq) / (2 * 576);
        const ATH_f = this.ATHmdct(gfp, freq);

        ATH_psfb21[sfb] = Math.min(ATH_psfb21[sfb], ATH_f);
      }
    }

    for (let sfb = 0; sfb < SBMAX_s; sfb++) {
      const start = gfc.scalefac_band.s[sfb];
      const end = gfc.scalefac_band.s[sfb + 1];
      ATH_s[sfb] = MAX_FLOAT32_VALUE;
      for (let i = start; i < end; i++) {
        const freq = (i * samp_freq) / (2 * 192);
        const ATH_f = this.ATHmdct(gfp, freq);

        ATH_s[sfb] = Math.min(ATH_s[sfb], ATH_f);
      }
      ATH_s[sfb] *= gfc.scalefac_band.s[sfb + 1] - gfc.scalefac_band.s[sfb];
    }

    for (let sfb = 0; sfb < PSFB12; sfb++) {
      const start = gfc.scalefac_band.psfb12[sfb];
      const end = gfc.scalefac_band.psfb12[sfb + 1];
      ATH_psfb12[sfb] = MAX_FLOAT32_VALUE;
      for (let i = start; i < end; i++) {
        const freq = (i * samp_freq) / (2 * 192);
        const ATH_f = this.ATHmdct(gfp, freq);

        ATH_psfb12[sfb] = Math.min(ATH_psfb12[sfb], ATH_f);
      }

      ATH_psfb12[sfb] *= gfc.scalefac_band.s[13] - gfc.scalefac_band.s[12];
    }

    gfc.ATH.floor = 10 * Math.log10(this.ATHmdct(gfp, -1));
  }

  iteration_init(gfp: LameGlobalFlags, tak: Takehiro) {
    const gfc = gfp.internal_flags;
    const { l3_side } = gfc;
    let i;

    if (!gfc.iteration_init_init) {
      gfc.iteration_init_init = true;

      l3_side.main_data_begin = 0;
      this.compute_ath(gfp);

      tak.huffman_init(gfc);

      i = (gfp.exp_nspsytune >> 2) & 63;
      if (i >= 32) i -= 64;
      const bass = Math.pow(10, i / 4.0 / 10.0);

      i = (gfp.exp_nspsytune >> 8) & 63;
      if (i >= 32) i -= 64;
      const alto = Math.pow(10, i / 4.0 / 10.0);

      i = (gfp.exp_nspsytune >> 14) & 63;
      if (i >= 32) i -= 64;
      const treble = Math.pow(10, i / 4.0 / 10.0);

      i = (gfp.exp_nspsytune >> 20) & 63;
      if (i >= 32) i -= 64;
      const sfb21 = treble * Math.pow(10, i / 4.0 / 10.0);
      for (i = 0; i < SBMAX_l; i++) {
        let f;
        if (i <= 6) f = bass;
        else if (i <= 13) f = alto;
        else if (i <= 20) f = treble;
        else f = sfb21;

        gfc.nsPsy.longfact[i] = f;
      }
      for (i = 0; i < SBMAX_s; i++) {
        let f;
        if (i <= 5) f = bass;
        else if (i <= 10) f = alto;
        else if (i <= 11) f = treble;
        else f = sfb21;

        gfc.nsPsy.shortfact[i] = f;
      }
    }
  }

  reduce_side(
    targ_bits: Int32Array,
    ms_ener_ratio: number,
    mean_bits: number,
    max_bits: number,
  ) {
    assert(max_bits <= MAX_BITS_PER_GRANULE);
    assert(targ_bits[0] + targ_bits[1] <= MAX_BITS_PER_GRANULE);

    let fac = (0.33 * (0.5 - ms_ener_ratio)) / 0.5;
    if (fac < 0) fac = 0;
    if (fac > 0.5) fac = 0.5;

    let move_bits = Math.trunc(fac * 0.5 * (targ_bits[0] + targ_bits[1]));

    if (move_bits > MAX_BITS_PER_CHANNEL - targ_bits[0]) {
      move_bits = MAX_BITS_PER_CHANNEL - targ_bits[0];
    }
    if (move_bits < 0) move_bits = 0;

    if (targ_bits[1] >= 125) {
      if (targ_bits[1] - move_bits > 125) {
        if (targ_bits[0] < mean_bits) targ_bits[0] += move_bits;
        targ_bits[1] -= move_bits;
      } else {
        targ_bits[0] += targ_bits[1] - 125;
        targ_bits[1] = 125;
      }
    }

    move_bits = targ_bits[0] + targ_bits[1];
    if (move_bits > max_bits) {
      targ_bits[0] = (max_bits * targ_bits[0]) / move_bits;
      targ_bits[1] = (max_bits * targ_bits[1]) / move_bits;
    }
    assert(targ_bits[0] <= MAX_BITS_PER_CHANNEL);
    assert(targ_bits[1] <= MAX_BITS_PER_CHANNEL);
    assert(targ_bits[0] + targ_bits[1] <= MAX_BITS_PER_GRANULE);
  }

  athAdjust(a: number, x: number, athFloor: number) {
    const o = 90.30873362;
    const p = 94.82444863;
    let u = Math.log10(x) * 10.0;
    const v = a * a;
    let w = 0.0;
    u -= athFloor;

    if (v > 1e-20) w = 1 + Math.log10(v) * (10.0 / o);
    if (w < 0) w = 0;
    u *= w;
    u += athFloor + o - p;

    return Math.pow(10, 0.1 * u);
  }

  // eslint-disable-next-line complexity
  calc_xmin(
    gfp: LameGlobalFlags,
    ratio: III_psy_ratio,
    cod_info: GrInfo,
    pxmin: Float32Array,
  ) {
    let pxminPos = 0;
    const gfc = gfp.internal_flags;
    let gsfb;
    let j = 0;
    let ath_over = 0;
    const { ATH } = gfc;
    const { xr } = cod_info;
    const enable_athaa_fix = gfp.VBR === VbrMode.vbr_mtrh ? 1 : 0;
    let { masking_lower } = gfc;

    if (gfp.VBR === VbrMode.vbr_mtrh || gfp.VBR === VbrMode.vbr_mt) {
      masking_lower = 1.0;
    }

    for (gsfb = 0; gsfb < cod_info.psy_lmax; gsfb++) {
      let en0;
      let xmin;
      let rh2;
      let l;

      if (gfp.VBR === VbrMode.vbr_rh || gfp.VBR === VbrMode.vbr_mtrh)
        xmin = this.athAdjust(ATH.adjust, ATH.l[gsfb], ATH.floor);
      else xmin = ATH.adjust * ATH.l[gsfb];

      const width = cod_info.width[gsfb];
      const rh1 = xmin / width;
      rh2 = QuantizePVT.DBL_EPSILON;
      l = width >> 1;
      en0 = 0.0;
      do {
        const xa = xr[j] * xr[j];
        en0 += xa;
        rh2 += xa < rh1 ? xa : rh1;
        j++;
        const xb = xr[j] * xr[j];
        en0 += xb;
        rh2 += xb < rh1 ? xb : rh1;
        j++;
      } while (--l > 0);
      if (en0 > xmin) ath_over++;

      if (gsfb === SBPSY_l) {
        const x = xmin * gfc.nsPsy.longfact[gsfb];
        if (rh2 < x) {
          rh2 = x;
        }
      }
      if (enable_athaa_fix !== 0) {
        xmin = rh2;
      }

      const e = ratio.en.l[gsfb];
      if (e > 0.0) {
        let x;
        x = (en0 * ratio.thm.l[gsfb] * masking_lower) / e;
        if (enable_athaa_fix !== 0) x *= gfc.nsPsy.longfact[gsfb];
        if (xmin < x) xmin = x;
      }

      if (enable_athaa_fix !== 0) pxmin[pxminPos++] = xmin;
      else pxmin[pxminPos++] = xmin * gfc.nsPsy.longfact[gsfb];
    }

    let max_nonzero = 575;
    if (cod_info.block_type !== SHORT_TYPE) {
      let k = 576;
      while (k-- !== 0 && isCloseToEachOther(xr[k], 0)) {
        max_nonzero = k;
      }
    }
    cod_info.max_nonzero_coeff = max_nonzero;

    for (
      let sfb = cod_info.sfb_smin;
      gsfb < cod_info.psymax;
      sfb++, gsfb += 3
    ) {
      let b;
      let tmpATH;
      if (gfp.VBR === VbrMode.vbr_rh || gfp.VBR === VbrMode.vbr_mtrh)
        tmpATH = this.athAdjust(ATH.adjust, ATH.s[sfb], ATH.floor);
      else tmpATH = ATH.adjust * ATH.s[sfb];

      const width = cod_info.width[gsfb];
      for (b = 0; b < 3; b++) {
        let en0 = 0.0;
        let xmin;
        let rh2;
        let l = width >> 1;

        const rh1 = tmpATH / width;
        rh2 = QuantizePVT.DBL_EPSILON;
        do {
          const xa = xr[j] * xr[j];
          en0 += xa;
          rh2 += xa < rh1 ? xa : rh1;
          j++;
          const xb = xr[j] * xr[j];
          en0 += xb;
          rh2 += xb < rh1 ? xb : rh1;
          j++;
        } while (--l > 0);
        if (en0 > tmpATH) ath_over++;
        if (sfb === SBPSY_s) {
          const x = tmpATH * gfc.nsPsy.shortfact[sfb];
          if (rh2 < x) {
            rh2 = x;
          }
        }
        if (enable_athaa_fix !== 0) xmin = rh2;
        else xmin = tmpATH;

        const e = ratio.en.s[sfb][b];
        if (e > 0.0) {
          let x;
          x = (en0 * ratio.thm.s[sfb][b] * masking_lower) / e;
          if (enable_athaa_fix !== 0) x *= gfc.nsPsy.shortfact[sfb];
          if (xmin < x) xmin = x;
        }

        if (enable_athaa_fix !== 0) pxmin[pxminPos++] = xmin;
        else pxmin[pxminPos++] = xmin * gfc.nsPsy.shortfact[sfb];
      }
    }

    return ath_over;
  }

  readonly pretab = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 2, 0,
  ] as const;
}
