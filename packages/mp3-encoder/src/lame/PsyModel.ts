import { FFT } from './FFT';
import type { III_psy_ratio } from './III_psy_ratio';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { LameInternalFlags } from './LameInternalFlags';
import { MPEGMode } from './MPEGMode';
import { ShortBlock } from './ShortBlock';
import { VbrMode } from './VbrMode';
import { fillArray } from './arrays';
import { assert } from './assert';
import {
  BLKSIZE,
  BLKSIZE_s,
  CBANDS,
  HBLKSIZE,
  HBLKSIZE_s,
  LOG10,
  MAX_FLOAT32_VALUE,
  NORM_TYPE,
  SBMAX_l,
  SBMAX_s,
  SHORT_TYPE,
  START_TYPE,
  STOP_TYPE,
} from './constants';

export class PsyModel {
  private readonly fft = new FFT();

  private readonly rpelev = 2;

  private readonly rpelev2 = 16;

  private readonly rpelev_s = 2;

  private readonly rpelev2_s = 16;

  private static readonly DELBARK = 0.34;

  private static readonly VO_SCALE = 1 / (14752 * 14752) / (BLKSIZE / 2);

  private readonly temporalmask_sustain_sec = 0.01;

  private static readonly NS_PREECHO_ATT0 = 0.8;

  private static readonly NS_PREECHO_ATT1 = 0.6;

  private static readonly NS_PREECHO_ATT2 = 0.3;

  private static readonly NS_MSFIX = 3.5;

  static readonly NSATTACKTHRE = 4.4;

  static readonly NSATTACKTHRE_S = 25;

  private static readonly NSFIRLEN = 21;

  private static readonly LN_TO_LOG10 = 0.2302585093;

  private psycho_loudness_approx(energy: Float32Array, gfc: LameInternalFlags) {
    let loudness_power = 0.0;

    for (let i = 0; i < BLKSIZE / 2; ++i) {
      loudness_power += energy[i] * gfc.ATH.eql_w[i];
    }
    loudness_power *= PsyModel.VO_SCALE;

    return loudness_power;
  }

  private compute_ffts(
    gfp: LameGlobalFlags,
    fftenergy: Float32Array,
    fftenergy_s: Float32Array[],
    wsamp_l: Float32Array[],
    wsamp_lPos: number,
    wsamp_s: Float32Array[][],
    wsamp_sPos: number,
    gr_out: number,
    chn: number,
    buffer: Float32Array[],
    bufPos: number,
  ) {
    const gfc = gfp.internal_flags;
    if (chn < 2) {
      this.fft.fft_long(gfc, wsamp_l[wsamp_lPos], chn, buffer, bufPos);
      this.fft.fft_short(gfc, wsamp_s[wsamp_sPos], chn, buffer, bufPos);
    } else if (chn === 2) {
      for (let j = BLKSIZE - 1; j >= 0; --j) {
        const l = wsamp_l[wsamp_lPos + 0][j];
        const r = wsamp_l[wsamp_lPos + 1][j];
        wsamp_l[wsamp_lPos + 0][j] = (l + r) * Math.SQRT2 * 0.5;
        wsamp_l[wsamp_lPos + 1][j] = (l - r) * Math.SQRT2 * 0.5;
      }
      for (let b = 2; b >= 0; --b) {
        for (let j = BLKSIZE_s - 1; j >= 0; --j) {
          const l = wsamp_s[wsamp_sPos + 0][b][j];
          const r = wsamp_s[wsamp_sPos + 1][b][j];
          wsamp_s[wsamp_sPos + 0][b][j] = (l + r) * Math.SQRT2 * 0.5;
          wsamp_s[wsamp_sPos + 1][b][j] = (l - r) * Math.SQRT2 * 0.5;
        }
      }
    }

    fftenergy[0] = wsamp_l[wsamp_lPos + 0][0];
    fftenergy[0] *= fftenergy[0];

    for (let j = BLKSIZE / 2 - 1; j >= 0; --j) {
      const re = wsamp_l[wsamp_lPos + 0][BLKSIZE / 2 - j];
      const im = wsamp_l[wsamp_lPos + 0][BLKSIZE / 2 + j];
      fftenergy[BLKSIZE / 2 - j] = (re * re + im * im) * 0.5;
    }
    for (let b = 2; b >= 0; --b) {
      fftenergy_s[b][0] = wsamp_s[wsamp_sPos + 0][b][0];
      fftenergy_s[b][0] *= fftenergy_s[b][0];
      for (let j = BLKSIZE_s / 2 - 1; j >= 0; --j) {
        const re = wsamp_s[wsamp_sPos + 0][b][BLKSIZE_s / 2 - j];
        const im = wsamp_s[wsamp_sPos + 0][b][BLKSIZE_s / 2 + j];
        fftenergy_s[b][BLKSIZE_s / 2 - j] = (re * re + im * im) * 0.5;
      }
    }

    let totalenergy = 0.0;
    for (let j = 11; j < HBLKSIZE; j++) {
      totalenergy += fftenergy[j];
    }

    gfc.tot_ener[chn] = totalenergy;

    if (gfp.athaa_loudapprox === 2 && chn < 2) {
      gfc.loudness_sq[gr_out][chn] = gfc.loudness_sq_save[chn];
      gfc.loudness_sq_save[chn] = this.psycho_loudness_approx(fftenergy, gfc);
    }
  }

  private static readonly I1LIMIT = 8;

  private static readonly I2LIMIT = 23;

  private static readonly MLIMIT = 15;

  private ma_max_i1 = 0;

  private ma_max_i2 = 0;

  private ma_max_m = 0;

  private readonly tab = [
    1.0, 0.79433, 0.63096, 0.63096, 0.63096, 0.63096, 0.63096, 0.25119, 0.11749,
  ] as const;

  private init_mask_add_max_values() {
    this.ma_max_i1 = Math.pow(10, (PsyModel.I1LIMIT + 1) / 16.0);
    this.ma_max_i2 = Math.pow(10, (PsyModel.I2LIMIT + 1) / 16.0);
    this.ma_max_m = Math.pow(10, PsyModel.MLIMIT / 10.0);
  }

  private readonly table1 = [
    3.3246 * 3.3246,
    3.23837 * 3.23837,
    3.15437 * 3.15437,
    3.00412 * 3.00412,
    2.86103 * 2.86103,
    2.65407 * 2.65407,
    2.46209 * 2.46209,
    2.284 * 2.284,
    2.11879 * 2.11879,
    1.96552 * 1.96552,
    1.82335 * 1.82335,
    1.69146 * 1.69146,
    1.56911 * 1.56911,
    1.46658 * 1.46658,
    1.37074 * 1.37074,
    1.31036 * 1.31036,
    1.25264 * 1.25264,
    1.20648 * 1.20648,
    1.16203 * 1.16203,
    1.12765 * 1.12765,
    1.09428 * 1.09428,
    1.0659 * 1.0659,
    1.03826 * 1.03826,
    1.01895 * 1.01895,
    1,
  ] as const;

  private readonly table2 = [
    1.33352 * 1.33352,
    1.35879 * 1.35879,
    1.38454 * 1.38454,
    1.39497 * 1.39497,
    1.40548 * 1.40548,
    1.3537 * 1.3537,
    1.30382 * 1.30382,
    1.22321 * 1.22321,
    1.14758 * 1.14758,
    1,
  ] as const;

  private readonly table3 = [
    2.35364 * 2.35364,
    2.29259 * 2.29259,
    2.23313 * 2.23313,
    2.12675 * 2.12675,
    2.02545 * 2.02545,
    1.87894 * 1.87894,
    1.74303 * 1.74303,
    1.61695 * 1.61695,
    1.49999 * 1.49999,
    1.39148 * 1.39148,
    1.29083 * 1.29083,
    1.19746 * 1.19746,
    1.11084 * 1.11084,
    1.03826 * 1.03826,
  ] as const;

  private mask_add(
    m1: number,
    m2: number,
    kk: number,
    b: number,
    gfc: LameInternalFlags,
    shortblock: number,
  ) {
    let ratio;

    if (m2 > m1) {
      if (m2 < m1 * this.ma_max_i2) ratio = m2 / m1;
      else return m1 + m2;
    } else {
      if (m1 >= m2 * this.ma_max_i2) return m1 + m2;
      ratio = m1 / m2;
    }

    assert(m1 >= 0);
    assert(m2 >= 0);

    m1 += m2;

    if (b + 3 <= 3 + 3) {
      if (ratio >= this.ma_max_i1) {
        return m1;
      }

      const i = Math.trunc(Math.log10(ratio) * 16.0);
      return m1 * this.table2[i];
    }

    const i = Math.trunc(Math.log10(ratio) * 16.0);
    if (shortblock !== 0) {
      m2 = gfc.ATH.cb_s[kk] * gfc.ATH.adjust;
    } else {
      m2 = gfc.ATH.cb_l[kk] * gfc.ATH.adjust;
    }
    assert(m2 >= 0);
    if (m1 < this.ma_max_m * m2) {
      if (m1 > m2) {
        let f;
        f = 1.0;
        if (i <= 13) f = this.table3[i];

        const r = Math.log10(m1 / m2) * (10.0 / 15.0);
        return m1 * ((this.table1[i] - f) * r + f);
      }

      if (i > 13) {
        return m1;
      }

      return m1 * this.table3[i];
    }

    return m1 * this.table1[i];
  }

  private readonly table2_ = [
    1.33352 * 1.33352,
    1.35879 * 1.35879,
    1.38454 * 1.38454,
    1.39497 * 1.39497,
    1.40548 * 1.40548,
    1.3537 * 1.3537,
    1.30382 * 1.30382,
    1.22321 * 1.22321,
    1.14758 * 1.14758,
    1,
  ] as const;

  private vbrpsy_mask_add(m1: number, m2: number, b: number) {
    let ratio;

    if (m1 < 0) {
      m1 = 0;
    }
    if (m2 < 0) {
      m2 = 0;
    }
    if (m1 <= 0) {
      return m2;
    }
    if (m2 <= 0) {
      return m1;
    }
    if (m2 > m1) {
      ratio = m2 / m1;
    } else {
      ratio = m1 / m2;
    }
    if (b >= -2 && b <= 2) {
      if (ratio >= this.ma_max_i1) {
        return m1 + m2;
      }
      const i = Math.trunc(Math.log10(ratio) * 16.0);
      return (m1 + m2) * this.table2_[i];
    }
    if (ratio < this.ma_max_i2) {
      return m1 + m2;
    }
    if (m1 < m2) {
      m1 = m2;
    }
    return m1;
  }

  private calc_interchannel_masking(gfp: LameGlobalFlags, ratio: number) {
    const gfc = gfp.internal_flags;
    if (gfc.channels_out > 1) {
      for (let sb = 0; sb < SBMAX_l; sb++) {
        const l = gfc.thm[0].l[sb];
        const r = gfc.thm[1].l[sb];
        gfc.thm[0].l[sb] += r * ratio;
        gfc.thm[1].l[sb] += l * ratio;
      }
      for (let sb = 0; sb < SBMAX_s; sb++) {
        for (let sblock = 0; sblock < 3; sblock++) {
          const l = gfc.thm[0].s[sb][sblock];
          const r = gfc.thm[1].s[sb][sblock];
          gfc.thm[0].s[sb][sblock] += r * ratio;
          gfc.thm[1].s[sb][sblock] += l * ratio;
        }
      }
    }
  }

  private msfix1(gfc: LameInternalFlags) {
    for (let sb = 0; sb < SBMAX_l; sb++) {
      if (
        gfc.thm[0].l[sb] > 1.58 * gfc.thm[1].l[sb] ||
        gfc.thm[1].l[sb] > 1.58 * gfc.thm[0].l[sb]
      )
        continue;
      let mld = gfc.mld_l[sb] * gfc.en[3].l[sb];
      const rmid = Math.max(gfc.thm[2].l[sb], Math.min(gfc.thm[3].l[sb], mld));

      mld = gfc.mld_l[sb] * gfc.en[2].l[sb];
      const rside = Math.max(gfc.thm[3].l[sb], Math.min(gfc.thm[2].l[sb], mld));
      gfc.thm[2].l[sb] = rmid;
      gfc.thm[3].l[sb] = rside;
    }

    for (let sb = 0; sb < SBMAX_s; sb++) {
      for (let sblock = 0; sblock < 3; sblock++) {
        if (
          gfc.thm[0].s[sb][sblock] > 1.58 * gfc.thm[1].s[sb][sblock] ||
          gfc.thm[1].s[sb][sblock] > 1.58 * gfc.thm[0].s[sb][sblock]
        )
          continue;
        let mld = gfc.mld_s[sb] * gfc.en[3].s[sb][sblock];
        const rmid = Math.max(
          gfc.thm[2].s[sb][sblock],
          Math.min(gfc.thm[3].s[sb][sblock], mld),
        );

        mld = gfc.mld_s[sb] * gfc.en[2].s[sb][sblock];
        const rside = Math.max(
          gfc.thm[3].s[sb][sblock],
          Math.min(gfc.thm[2].s[sb][sblock], mld),
        );

        gfc.thm[2].s[sb][sblock] = rmid;
        gfc.thm[3].s[sb][sblock] = rside;
      }
    }
  }

  private ns_msfix(gfc: LameInternalFlags, msfix: number, athadjust: number) {
    let msfix2 = msfix;
    let athlower = Math.pow(10, athadjust);

    msfix *= 2.0;
    msfix2 *= 2.0;
    for (let sb = 0; sb < SBMAX_l; sb++) {
      let thmM;
      let thmS;
      const ath = gfc.ATH.cb_l[gfc.bm_l[sb]] * athlower;
      const thmLR = Math.min(
        Math.max(gfc.thm[0].l[sb], ath),
        Math.max(gfc.thm[1].l[sb], ath),
      );
      thmM = Math.max(gfc.thm[2].l[sb], ath);
      thmS = Math.max(gfc.thm[3].l[sb], ath);
      if (thmLR * msfix < thmM + thmS) {
        const f = (thmLR * msfix2) / (thmM + thmS);
        thmM *= f;
        thmS *= f;
        assert(thmM + thmS > 0);
      }
      gfc.thm[2].l[sb] = Math.min(thmM, gfc.thm[2].l[sb]);
      gfc.thm[3].l[sb] = Math.min(thmS, gfc.thm[3].l[sb]);
    }

    athlower *= BLKSIZE_s / BLKSIZE;
    for (let sb = 0; sb < SBMAX_s; sb++) {
      for (let sblock = 0; sblock < 3; sblock++) {
        let thmM;
        let thmS;
        const ath = gfc.ATH.cb_s[gfc.bm_s[sb]] * athlower;
        const thmLR = Math.min(
          Math.max(gfc.thm[0].s[sb][sblock], ath),
          Math.max(gfc.thm[1].s[sb][sblock], ath),
        );
        thmM = Math.max(gfc.thm[2].s[sb][sblock], ath);
        thmS = Math.max(gfc.thm[3].s[sb][sblock], ath);

        if (thmLR * msfix < thmM + thmS) {
          const f = (thmLR * msfix) / (thmM + thmS);
          thmM *= f;
          thmS *= f;
          assert(thmM + thmS > 0);
        }
        gfc.thm[2].s[sb][sblock] = Math.min(gfc.thm[2].s[sb][sblock], thmM);
        gfc.thm[3].s[sb][sblock] = Math.min(gfc.thm[3].s[sb][sblock], thmS);
      }
    }
  }

  private convert_partition2scalefac_s(
    gfc: LameInternalFlags,
    eb: Float32Array,
    thr: Float32Array,
    chn: number,
    sblock: number,
  ) {
    let sb = 0;
    let b = 0;
    let enn = 0.0;
    let thmm = 0.0;
    for (; sb < SBMAX_s; ++b, ++sb) {
      const bo_s_sb = gfc.bo_s[sb];
      const { npart_s } = gfc;
      const b_lim = bo_s_sb < npart_s ? bo_s_sb : npart_s;
      while (b < b_lim) {
        assert(eb[b] >= 0);

        assert(thr[b] >= 0);
        enn += eb[b];
        thmm += thr[b];
        b++;
      }
      gfc.en[chn].s[sb][sblock] = enn;
      gfc.thm[chn].s[sb][sblock] = thmm;

      if (b >= npart_s) {
        ++sb;
        break;
      }
      assert(eb[b] >= 0);

      assert(thr[b] >= 0);

      const w_curr = gfc.PSY.bo_s_weight[sb];
      const w_next = 1.0 - w_curr;
      enn = w_curr * eb[b];
      thmm = w_curr * thr[b];
      gfc.en[chn].s[sb][sblock] += enn;
      gfc.thm[chn].s[sb][sblock] += thmm;
      enn = w_next * eb[b];
      thmm = w_next * thr[b];
    }

    for (; sb < SBMAX_s; ++sb) {
      gfc.en[chn].s[sb][sblock] = 0;
      gfc.thm[chn].s[sb][sblock] = 0;
    }
  }

  private convert_partition2scalefac_l(
    gfc: LameInternalFlags,
    eb: Float32Array,
    thr: Float32Array,
    chn: number,
  ) {
    let sb = 0;
    let b = 0;
    let enn = 0.0;
    let thmm = 0.0;
    for (; sb < SBMAX_l; ++b, ++sb) {
      const bo_l_sb = gfc.bo_l[sb];
      const { npart_l } = gfc;
      const b_lim = bo_l_sb < npart_l ? bo_l_sb : npart_l;
      while (b < b_lim) {
        assert(eb[b] >= 0);

        assert(thr[b] >= 0);
        enn += eb[b];
        thmm += thr[b];
        b++;
      }
      gfc.en[chn].l[sb] = enn;
      gfc.thm[chn].l[sb] = thmm;

      if (b >= npart_l) {
        ++sb;
        break;
      }
      assert(eb[b] >= 0);
      assert(thr[b] >= 0);

      const w_curr = gfc.PSY.bo_l_weight[sb];
      const w_next = 1.0 - w_curr;
      enn = w_curr * eb[b];
      thmm = w_curr * thr[b];
      gfc.en[chn].l[sb] += enn;
      gfc.thm[chn].l[sb] += thmm;
      enn = w_next * eb[b];
      thmm = w_next * thr[b];
    }

    for (; sb < SBMAX_l; ++sb) {
      gfc.en[chn].l[sb] = 0;
      gfc.thm[chn].l[sb] = 0;
    }
  }

  private compute_masking_s(
    gfp: LameGlobalFlags,
    fftenergy_s: Float32Array[],
    eb: Float32Array,
    thr: Float32Array,
    chn: number,
    sblock: number,
  ) {
    const gfc = gfp.internal_flags;
    let j = 0;
    let b = 0;

    for (; b < gfc.npart_s; ++b) {
      let ebb = 0;
      let m = 0;
      const n = gfc.numlines_s[b];
      for (let i = 0; i < n; ++i, ++j) {
        const el = fftenergy_s[sblock][j];
        ebb += el;
        if (m < el) m = el;
      }
      eb[b] = ebb;
    }
    assert(b === gfc.npart_s);
    assert(j === 129);
    j = 0;
    b = 0;
    assert(gfc.s3_ss !== null);
    for (; b < gfc.npart_s; b++) {
      let kk = gfc.s3ind_s[b][0];
      let ecb = gfc.s3_ss[j++] * eb[kk];
      ++kk;
      while (kk <= gfc.s3ind_s[b][1]) {
        ecb += gfc.s3_ss[j] * eb[kk];
        ++j;
        ++kk;
      }

      const x = this.rpelev_s * gfc.nb_s1[chn][b];
      thr[b] = Math.min(ecb, x);

      if (gfc.blocktype_old[chn & 1] === SHORT_TYPE) {
        const x = this.rpelev2_s * gfc.nb_s2[chn][b];
        const y = thr[b];
        thr[b] = Math.min(x, y);
      }

      gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
      gfc.nb_s1[chn][b] = ecb;
      assert(thr[b] >= 0);
    }
    for (; b <= CBANDS; ++b) {
      eb[b] = 0;
      thr[b] = 0;
    }
  }

  private block_type_set(
    gfp: LameGlobalFlags,
    uselongblock: Int32Array,
    blocktype_d: Int32Array,
    blocktype: Int32Array,
  ) {
    const gfc = gfp.internal_flags;

    if (
      gfp.short_blocks === ShortBlock.short_block_coupled &&
      !(uselongblock[0] !== 0 && uselongblock[1] !== 0)
    ) {
      uselongblock[0] = 0;
      uselongblock[1] = 0;
    }

    for (let chn = 0; chn < gfc.channels_out; chn++) {
      blocktype[chn] = NORM_TYPE;

      if (gfp.short_blocks === ShortBlock.short_block_dispensed)
        uselongblock[chn] = 1;
      if (gfp.short_blocks === ShortBlock.short_block_forced)
        uselongblock[chn] = 0;

      if (uselongblock[chn] !== 0) {
        assert(gfc.blocktype_old[chn] !== START_TYPE);
        if (gfc.blocktype_old[chn] === SHORT_TYPE) blocktype[chn] = STOP_TYPE;
      } else {
        blocktype[chn] = SHORT_TYPE;
        if (gfc.blocktype_old[chn] === NORM_TYPE) {
          gfc.blocktype_old[chn] = START_TYPE;
        }
        if (gfc.blocktype_old[chn] === STOP_TYPE)
          gfc.blocktype_old[chn] = SHORT_TYPE;
      }

      blocktype_d[chn] = gfc.blocktype_old[chn];

      gfc.blocktype_old[chn] = blocktype[chn];
    }
  }

  private nsInterp(x: number, y: number, r: number) {
    if (r >= 1.0) {
      return x;
    }
    if (r <= 0.0) return y;
    if (y > 0.0) {
      return Math.pow(x / y, r) * y;
    }

    return 0.0;
  }

  private readonly regcoef_s = [
    11.8, 13.6, 17.2, 32, 46.5, 51.3, 57.5, 67.1, 71.5, 84.6, 97.6, 130,
  ] as const;

  private pecalc_s(mr: III_psy_ratio, masking_lower: number) {
    let pe_s = 1236.28 / 4;
    for (let sb = 0; sb < SBMAX_s - 1; sb++) {
      for (let sblock = 0; sblock < 3; sblock++) {
        const thm = mr.thm.s[sb][sblock];
        assert(sb < this.regcoef_s.length);
        if (thm > 0.0) {
          const x = thm * masking_lower;
          const en = mr.en.s[sb][sblock];
          if (en > x) {
            if (en > x * 1e10) {
              pe_s += this.regcoef_s[sb] * (10.0 * LOG10);
            } else {
              assert(x > 0);
              pe_s += this.regcoef_s[sb] * Math.log10(en / x);
            }
          }
        }
      }
    }

    return pe_s;
  }

  private readonly regcoef_l = [
    6.8, 5.8, 5.8, 6.4, 6.5, 9.9, 12.1, 14.4, 15, 18.9, 21.6, 26.9, 34.2, 40.2,
    46.8, 56.5, 60.7, 73.9, 85.7, 93.4, 126.1,
  ] as const;

  private pecalc_l(mr: III_psy_ratio, masking_lower: number) {
    let pe_l = 1124.23 / 4;
    for (let sb = 0; sb < SBMAX_l - 1; sb++) {
      const thm = mr.thm.l[sb];
      assert(sb < this.regcoef_l.length);
      if (thm > 0.0) {
        const x = thm * masking_lower;
        const en = mr.en.l[sb];
        if (en > x) {
          if (en > x * 1e10) {
            pe_l += this.regcoef_l[sb] * (10.0 * LOG10);
          } else {
            assert(x > 0);
            pe_l += this.regcoef_l[sb] * Math.log10(en / x);
          }
        }
      }
    }
    return pe_l;
  }

  private calc_energy(
    gfc: LameInternalFlags,
    fftenergy: Float32Array,
    eb: Float32Array,
    max: Float32Array,
    avg: Float32Array,
  ) {
    let b = 0;
    let j = 0;

    for (; b < gfc.npart_l; ++b) {
      let ebb = 0;
      let m = 0;
      let i;
      for (i = 0; i < gfc.numlines_l[b]; ++i, ++j) {
        const el = fftenergy[j];
        assert(el >= 0);
        ebb += el;
        if (m < el) m = el;
      }
      eb[b] = ebb;
      max[b] = m;
      avg[b] = ebb * gfc.rnumlines_l[b];
      assert(gfc.rnumlines_l[b] >= 0);
      assert(ebb >= 0);
      assert(eb[b] >= 0);
      assert(max[b] >= 0);
      assert(avg[b] >= 0);
    }
  }

  private calc_mask_index_l(
    gfc: LameInternalFlags,
    max: Float32Array,
    avg: Float32Array,
    mask_idx: Int32Array,
  ) {
    const last_tab_entry = this.tab.length - 1;
    let b = 0;
    let a = avg[b] + avg[b + 1];
    assert(a >= 0);
    if (a > 0.0) {
      let m = max[b];
      if (m < max[b + 1]) m = max[b + 1];
      assert(gfc.numlines_l[b] + gfc.numlines_l[b + 1] - 1 > 0);
      a =
        (20.0 * (m * 2.0 - a)) /
        (a * (gfc.numlines_l[b] + gfc.numlines_l[b + 1] - 1));
      let k = Math.trunc(a);
      if (k > last_tab_entry) k = last_tab_entry;
      mask_idx[b] = k;
    } else {
      mask_idx[b] = 0;
    }

    for (b = 1; b < gfc.npart_l - 1; b++) {
      a = avg[b - 1] + avg[b] + avg[b + 1];
      assert(a >= 0);
      if (a > 0.0) {
        let m = max[b - 1];
        if (m < max[b]) m = max[b];
        if (m < max[b + 1]) m = max[b + 1];
        assert(
          gfc.numlines_l[b - 1] +
            gfc.numlines_l[b] +
            gfc.numlines_l[b + 1] -
            1 >
            0,
        );
        a =
          (20.0 * (m * 3.0 - a)) /
          (a *
            (gfc.numlines_l[b - 1] +
              gfc.numlines_l[b] +
              gfc.numlines_l[b + 1] -
              1));
        let k = Math.trunc(a);
        if (k > last_tab_entry) k = last_tab_entry;
        mask_idx[b] = k;
      } else {
        mask_idx[b] = 0;
      }
    }
    assert(b > 0);
    assert(b === gfc.npart_l - 1);

    a = avg[b - 1] + avg[b];
    assert(a >= 0);
    if (a > 0.0) {
      let m = max[b - 1];
      if (m < max[b]) m = max[b];
      assert(gfc.numlines_l[b - 1] + gfc.numlines_l[b] - 1 > 0);
      a =
        (20.0 * (m * 2.0 - a)) /
        (a * (gfc.numlines_l[b - 1] + gfc.numlines_l[b] - 1));
      let k = Math.trunc(a);
      if (k > last_tab_entry) k = last_tab_entry;
      mask_idx[b] = k;
    } else {
      mask_idx[b] = 0;
    }
    assert(b === gfc.npart_l - 1);
  }

  private readonly fircoef = [
    -8.65163e-18 * 2,
    -0.00851586 * 2,
    -6.74764e-18 * 2,
    0.0209036 * 2,
    -3.36639e-17 * 2,
    -0.0438162 * 2,
    -1.54175e-17 * 2,
    0.0931738 * 2,
    -5.52212e-17 * 2,
    -0.313819 * 2,
  ] as const;

  // eslint-disable-next-line complexity
  L3psycho_anal_ns(
    gfp: LameGlobalFlags,
    buffer: Float32Array[],
    bufPos: number,
    gr_out: number,
    masking_ratio: III_psy_ratio[][],
    masking_MS_ratio: III_psy_ratio[][],
    percep_entropy: number[],
    percep_MS_entropy: number[],
    energy: Float32Array,
    blocktype_d: Int32Array,
  ) {
    const gfc = gfp.internal_flags;

    const wsamp_L = Array.from({ length: 2 }, () => new Float32Array(BLKSIZE));
    const wsamp_S = Array.from({ length: 2 }, () =>
      Array.from({ length: 3 }, () => new Float32Array(BLKSIZE_s)),
    );

    const eb_l = new Float32Array(CBANDS + 1);
    const eb_s = new Float32Array(CBANDS + 1);
    const thr = new Float32Array(CBANDS + 2);

    const blocktype = new Int32Array(2);
    const uselongblock = new Int32Array(2);

    let numchn;
    let chn;
    let b;
    let i;
    let j;
    let k;
    let sb;
    let sblock;

    const ns_hpfsmpl = Array.from({ length: 2 }, () => new Float32Array(576));
    let pcfact;
    const mask_idx_l = new Int32Array(CBANDS + 2);
    const mask_idx_s = new Int32Array(CBANDS + 2);

    fillArray(mask_idx_s, 0);

    numchn = gfc.channels_out;

    if (gfp.mode === MPEGMode.JOINT_STEREO) {
      numchn = 4;
    }

    if (gfp.VBR === VbrMode.vbr_off) {
      pcfact = 0;
    } else if (
      gfp.VBR === VbrMode.vbr_rh ||
      gfp.VBR === VbrMode.vbr_mtrh ||
      gfp.VBR === VbrMode.vbr_mt
    ) {
      pcfact = 0.6;
    } else pcfact = 1.0;

    for (chn = 0; chn < gfc.channels_out; chn++) {
      const firbuf = buffer[chn];
      const firbufPos = bufPos + 576 - 350 - PsyModel.NSFIRLEN + 192;
      assert(this.fircoef.length === (PsyModel.NSFIRLEN - 1) / 2);
      for (i = 0; i < 576; i++) {
        let sum1;
        let sum2;
        sum1 = firbuf[firbufPos + i + 10];
        sum2 = 0.0;
        for (j = 0; j < (PsyModel.NSFIRLEN - 1) / 2 - 1; j += 2) {
          sum1 +=
            this.fircoef[j] *
            (firbuf[firbufPos + i + j] +
              firbuf[firbufPos + i + PsyModel.NSFIRLEN - j]);
          sum2 +=
            this.fircoef[j + 1] *
            (firbuf[firbufPos + i + j + 1] +
              firbuf[firbufPos + i + PsyModel.NSFIRLEN - j - 1]);
        }
        ns_hpfsmpl[chn][i] = sum1 + sum2;
      }
      masking_ratio[gr_out][chn].en.assign(gfc.en[chn]);
      masking_ratio[gr_out][chn].thm.assign(gfc.thm[chn]);
      if (numchn > 2) {
        masking_MS_ratio[gr_out][chn].en.assign(gfc.en[chn + 2]);
        masking_MS_ratio[gr_out][chn].thm.assign(gfc.thm[chn + 2]);
      }
    }

    for (chn = 0; chn < numchn; chn++) {
      const en_subshort = new Float32Array(12);
      const en_short = [0, 0, 0, 0];
      const attack_intensity = new Float32Array(12);
      let ns_uselongblock = 1;
      const max = new Float32Array(CBANDS);
      const avg = new Float32Array(CBANDS);
      const ns_attacks = [0, 0, 0, 0];
      const fftenergy = new Float32Array(HBLKSIZE);
      const fftenergy_s = Array.from(
        { length: 3 },
        () => new Float32Array(HBLKSIZE_s),
      );

      assert(gfc.npart_s <= CBANDS);
      assert(gfc.npart_l <= CBANDS);

      for (i = 0; i < 3; i++) {
        en_subshort[i] = gfc.nsPsy.last_en_subshort[chn][i + 6];
        assert(gfc.nsPsy.last_en_subshort[chn][i + 4] > 0);
        attack_intensity[i] =
          en_subshort[i] / gfc.nsPsy.last_en_subshort[chn][i + 4];
        en_short[0] += en_subshort[i];
      }

      if (chn === 2) {
        for (i = 0; i < 576; i++) {
          const l = ns_hpfsmpl[0][i];
          const r = ns_hpfsmpl[1][i];
          ns_hpfsmpl[0][i] = l + r;
          ns_hpfsmpl[1][i] = l - r;
        }
      }

      const pf = ns_hpfsmpl[chn & 1];
      let pfPos = 0;
      for (i = 0; i < 9; i++) {
        const pfe = pfPos + 576 / 9;
        let p = 1;
        for (; pfPos < pfe; pfPos++)
          if (p < Math.abs(pf[pfPos])) p = Math.abs(pf[pfPos]);

        gfc.nsPsy.last_en_subshort[chn][i] = p;
        en_subshort[i + 3] = p;
        en_short[1 + i / 3] += p;
        if (p > en_subshort[i + 3 - 2]) {
          assert(en_subshort[i + 3 - 2] > 0);
          p /= en_subshort[i + 3 - 2];
        } else if (en_subshort[i + 3 - 2] > p * 10.0) {
          assert(p > 0);
          p = en_subshort[i + 3 - 2] / (p * 10.0);
        } else p = 0.0;
        attack_intensity[i + 3] = p;
      }

      const attackThreshold =
        chn === 3 ? gfc.nsPsy.attackthre_s : gfc.nsPsy.attackthre;
      for (i = 0; i < 12; i++) {
        if (ns_attacks[i / 3] === 0 && attack_intensity[i] > attackThreshold) {
          ns_attacks[i / 3] = (i % 3) + 1;
        }
      }

      for (i = 1; i < 4; i++) {
        let ratio;
        if (en_short[i - 1] > en_short[i]) {
          assert(en_short[i] > 0);
          ratio = en_short[i - 1] / en_short[i];
        } else {
          assert(en_short[i - 1] > 0);
          ratio = en_short[i] / en_short[i - 1];
        }
        if (ratio < 1.7) {
          ns_attacks[i] = 0;
          if (i === 1) ns_attacks[0] = 0;
        }
      }

      if (ns_attacks[0] !== 0 && gfc.nsPsy.lastAttacks[chn] !== 0)
        ns_attacks[0] = 0;

      if (
        gfc.nsPsy.lastAttacks[chn] === 3 ||
        ns_attacks[0] + ns_attacks[1] + ns_attacks[2] + ns_attacks[3] !== 0
      ) {
        ns_uselongblock = 0;

        if (ns_attacks[1] !== 0 && ns_attacks[0] !== 0) ns_attacks[1] = 0;
        if (ns_attacks[2] !== 0 && ns_attacks[1] !== 0) ns_attacks[2] = 0;
        if (ns_attacks[3] !== 0 && ns_attacks[2] !== 0) ns_attacks[3] = 0;
      }

      if (chn < 2) {
        uselongblock[chn] = ns_uselongblock;
      } else if (ns_uselongblock === 0) {
        uselongblock[0] = 0;
        uselongblock[1] = 0;
      }

      energy[chn] = gfc.tot_ener[chn];

      const wsamp_s = wsamp_S;
      const wsamp_l = wsamp_L;
      this.compute_ffts(
        gfp,
        fftenergy,
        fftenergy_s,
        wsamp_l,
        chn & 1,
        wsamp_s,
        chn & 1,
        gr_out,
        chn,
        buffer,
        bufPos,
      );

      this.calc_energy(gfc, fftenergy, eb_l, max, avg);
      this.calc_mask_index_l(gfc, max, avg, mask_idx_l);

      for (sblock = 0; sblock < 3; sblock++) {
        let enn;
        let thmm;
        this.compute_masking_s(gfp, fftenergy_s, eb_s, thr, chn, sblock);
        this.convert_partition2scalefac_s(gfc, eb_s, thr, chn, sblock);

        for (sb = 0; sb < SBMAX_s; sb++) {
          thmm = gfc.thm[chn].s[sb][sblock];

          thmm *= PsyModel.NS_PREECHO_ATT0;
          if (ns_attacks[sblock] >= 2 || ns_attacks[sblock + 1] === 1) {
            const idx = sblock !== 0 ? sblock - 1 : 2;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT1 * pcfact,
            );
            thmm = Math.min(thmm, p);
          }

          if (ns_attacks[sblock] === 1) {
            const idx = sblock !== 0 ? sblock - 1 : 2;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT2 * pcfact,
            );
            thmm = Math.min(thmm, p);
          } else if (
            (sblock !== 0 && ns_attacks[sblock - 1] === 3) ||
            (sblock === 0 && gfc.nsPsy.lastAttacks[chn] === 3)
          ) {
            const idx = sblock !== 2 ? sblock + 1 : 0;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT2 * pcfact,
            );
            thmm = Math.min(thmm, p);
          }

          enn =
            en_subshort[sblock * 3 + 3] +
            en_subshort[sblock * 3 + 4] +
            en_subshort[sblock * 3 + 5];
          if (en_subshort[sblock * 3 + 5] * 6 < enn) {
            thmm *= 0.5;
            if (en_subshort[sblock * 3 + 4] * 6 < enn) thmm *= 0.5;
          }

          gfc.thm[chn].s[sb][sblock] = thmm;
        }
      }
      gfc.nsPsy.lastAttacks[chn] = ns_attacks[2];

      k = 0;

      assert(gfc.s3_ll !== null);
      for (b = 0; b < gfc.npart_l; b++) {
        let kk = gfc.s3ind[b][0];
        let eb2 = eb_l[kk] * this.tab[mask_idx_l[kk]];
        let ecb = gfc.s3_ll[k++] * eb2;
        while (++kk <= gfc.s3ind[b][1]) {
          eb2 = eb_l[kk] * this.tab[mask_idx_l[kk]];
          ecb = this.mask_add(ecb, gfc.s3_ll[k++] * eb2, kk, kk - b, gfc, 0);
        }
        ecb *= 0.158489319246111;

        if (gfc.blocktype_old[chn & 1] === SHORT_TYPE) thr[b] = ecb;
        else
          thr[b] = this.nsInterp(
            Math.min(
              ecb,
              Math.min(
                this.rpelev * gfc.nb_1[chn][b],
                this.rpelev2 * gfc.nb_2[chn][b],
              ),
            ),
            ecb,
            pcfact,
          );

        gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
        gfc.nb_1[chn][b] = ecb;
      }

      for (; b <= CBANDS; ++b) {
        eb_l[b] = 0;
        thr[b] = 0;
      }

      this.convert_partition2scalefac_l(gfc, eb_l, thr, chn);
    }

    if (gfp.mode === MPEGMode.STEREO || gfp.mode === MPEGMode.JOINT_STEREO) {
      if (gfp.interChRatio > 0.0) {
        this.calc_interchannel_masking(gfp, gfp.interChRatio);
      }
    }

    if (gfp.mode === MPEGMode.JOINT_STEREO) {
      this.msfix1(gfc);
      const { msfix } = gfp;
      if (Math.abs(msfix) > 0.0)
        this.ns_msfix(gfc, msfix, gfp.ATHlower * gfc.ATH.adjust);
    }

    this.block_type_set(gfp, uselongblock, blocktype_d, blocktype);

    for (chn = 0; chn < numchn; chn++) {
      let ppe;
      let ppePos = 0;
      let type;
      let mr;

      if (chn > 1) {
        ppe = percep_MS_entropy;
        ppePos = -2;
        type = NORM_TYPE;
        if (blocktype_d[0] === SHORT_TYPE || blocktype_d[1] === SHORT_TYPE)
          type = SHORT_TYPE;
        mr = masking_MS_ratio[gr_out][chn - 2];
      } else {
        ppe = percep_entropy;
        ppePos = 0;
        type = blocktype_d[chn];
        mr = masking_ratio[gr_out][chn];
      }

      if (type === SHORT_TYPE)
        ppe[ppePos + chn] = this.pecalc_s(mr, gfc.masking_lower);
      else ppe[ppePos + chn] = this.pecalc_l(mr, gfc.masking_lower);
    }
    return 0;
  }

  private vbrpsy_compute_fft_l(
    gfp: LameGlobalFlags,
    buffer: Float32Array[],
    bufPos: number,
    chn: number,
    fftenergy: Float32Array,
    wsamp_l: Float32Array[],
    wsamp_lPos: number,
  ) {
    const gfc = gfp.internal_flags;
    if (chn < 2) {
      this.fft.fft_long(gfc, wsamp_l[wsamp_lPos], chn, buffer, bufPos);
    } else if (chn === 2) {
      for (let j = BLKSIZE - 1; j >= 0; --j) {
        const l = wsamp_l[wsamp_lPos + 0][j];
        const r = wsamp_l[wsamp_lPos + 1][j];
        wsamp_l[wsamp_lPos + 0][j] = (l + r) * Math.SQRT2 * 0.5;
        wsamp_l[wsamp_lPos + 1][j] = (l - r) * Math.SQRT2 * 0.5;
      }
    }

    fftenergy[0] = wsamp_l[wsamp_lPos + 0][0];
    fftenergy[0] *= fftenergy[0];

    for (let j = BLKSIZE / 2 - 1; j >= 0; --j) {
      const re = wsamp_l[wsamp_lPos + 0][BLKSIZE / 2 - j];
      const im = wsamp_l[wsamp_lPos + 0][BLKSIZE / 2 + j];
      fftenergy[BLKSIZE / 2 - j] = (re * re + im * im) * 0.5;
    }

    let totalenergy = 0.0;
    for (let j = 11; j < HBLKSIZE; j++) totalenergy += fftenergy[j];

    gfc.tot_ener[chn] = totalenergy;
  }

  private vbrpsy_compute_fft_s(
    gfp: LameGlobalFlags,
    buffer: Float32Array[],
    bufPos: number,
    chn: number,
    sblock: number,
    fftenergy_s: Float32Array[],
    wsamp_s: Float32Array[][],
    wsamp_sPos: number,
  ) {
    const gfc = gfp.internal_flags;

    if (sblock === 0 && chn < 2) {
      this.fft.fft_short(gfc, wsamp_s[wsamp_sPos], chn, buffer, bufPos);
    }
    if (chn === 2) {
      for (let j = BLKSIZE_s - 1; j >= 0; --j) {
        const l = wsamp_s[wsamp_sPos + 0][sblock][j];
        const r = wsamp_s[wsamp_sPos + 1][sblock][j];
        wsamp_s[wsamp_sPos + 0][sblock][j] = (l + r) * Math.SQRT2 * 0.5;
        wsamp_s[wsamp_sPos + 1][sblock][j] = (l - r) * Math.SQRT2 * 0.5;
      }
    }

    fftenergy_s[sblock][0] = wsamp_s[wsamp_sPos + 0][sblock][0];
    fftenergy_s[sblock][0] *= fftenergy_s[sblock][0];
    for (let j = BLKSIZE_s / 2 - 1; j >= 0; --j) {
      const re = wsamp_s[wsamp_sPos + 0][sblock][BLKSIZE_s / 2 - j];
      const im = wsamp_s[wsamp_sPos + 0][sblock][BLKSIZE_s / 2 + j];
      fftenergy_s[sblock][BLKSIZE_s / 2 - j] = (re * re + im * im) * 0.5;
    }
  }

  private vbrpsy_compute_loudness_approximation_l(
    gfp: LameGlobalFlags,
    gr_out: number,
    chn: number,
    fftenergy: Float32Array,
  ) {
    const gfc = gfp.internal_flags;
    if (gfp.athaa_loudapprox === 2 && chn < 2) {
      gfc.loudness_sq[gr_out][chn] = gfc.loudness_sq_save[chn];
      gfc.loudness_sq_save[chn] = this.psycho_loudness_approx(fftenergy, gfc);
    }
  }

  private readonly fircoef_ = [
    -8.65163e-18 * 2,
    -0.00851586 * 2,
    -6.74764e-18 * 2,
    0.0209036 * 2,
    -3.36639e-17 * 2,
    -0.0438162 * 2,
    -1.54175e-17 * 2,
    0.0931738 * 2,
    -5.52212e-17 * 2,
    -0.313819 * 2,
  ] as const;

  // eslint-disable-next-line complexity
  private vbrpsy_attack_detection(
    gfp: LameGlobalFlags,
    buffer: Float32Array[],
    bufPos: number,
    gr_out: number,
    masking_ratio: III_psy_ratio[][],
    masking_MS_ratio: III_psy_ratio[][],
    energy: Float32Array,
    sub_short_factor: Float32Array[],
    ns_attacks: number[][],
    uselongblock: Int32Array,
  ) {
    const ns_hpfsmpl = Array.from({ length: 2 }, () => new Float32Array(576));
    const gfc = gfp.internal_flags;
    const n_chn_out = gfc.channels_out;

    const n_chn_psy = gfp.mode === MPEGMode.JOINT_STEREO ? 4 : n_chn_out;

    for (let chn = 0; chn < n_chn_out; chn++) {
      const firbuf = buffer[chn];
      const firbufPos = bufPos + 576 - 350 - PsyModel.NSFIRLEN + 192;
      assert(this.fircoef_.length === (PsyModel.NSFIRLEN - 1) / 2);
      for (let i = 0; i < 576; i++) {
        let sum1;
        let sum2;
        sum1 = firbuf[firbufPos + i + 10];
        sum2 = 0.0;
        for (let j = 0; j < (PsyModel.NSFIRLEN - 1) / 2 - 1; j += 2) {
          sum1 +=
            this.fircoef_[j] *
            (firbuf[firbufPos + i + j] +
              firbuf[firbufPos + i + PsyModel.NSFIRLEN - j]);
          sum2 +=
            this.fircoef_[j + 1] *
            (firbuf[firbufPos + i + j + 1] +
              firbuf[firbufPos + i + PsyModel.NSFIRLEN - j - 1]);
        }
        ns_hpfsmpl[chn][i] = sum1 + sum2;
      }
      masking_ratio[gr_out][chn].en.assign(gfc.en[chn]);
      masking_ratio[gr_out][chn].thm.assign(gfc.thm[chn]);
      if (n_chn_psy > 2) {
        masking_MS_ratio[gr_out][chn].en.assign(gfc.en[chn + 2]);
        masking_MS_ratio[gr_out][chn].thm.assign(gfc.thm[chn + 2]);
      }
    }
    for (let chn = 0; chn < n_chn_psy; chn++) {
      const attack_intensity = new Float32Array(12);
      const en_subshort = new Float32Array(12);
      const en_short = [0, 0, 0, 0];
      const pf = ns_hpfsmpl[chn & 1];
      let pfPos = 0;
      const attackThreshold =
        chn === 3 ? gfc.nsPsy.attackthre_s : gfc.nsPsy.attackthre;
      let ns_uselongblock = 1;

      if (chn === 2) {
        for (let i = 0, j = 576; j > 0; ++i, --j) {
          const l = ns_hpfsmpl[0][i];
          const r = ns_hpfsmpl[1][i];
          ns_hpfsmpl[0][i] = l + r;
          ns_hpfsmpl[1][i] = l - r;
        }
      }

      for (let i = 0; i < 3; i++) {
        en_subshort[i] = gfc.nsPsy.last_en_subshort[chn][i + 6];
        assert(gfc.nsPsy.last_en_subshort[chn][i + 4] > 0);
        attack_intensity[i] =
          en_subshort[i] / gfc.nsPsy.last_en_subshort[chn][i + 4];
        en_short[0] += en_subshort[i];
      }

      for (let i = 0; i < 9; i++) {
        const pfe = pfPos + 576 / 9;
        let p = 1;
        for (; pfPos < pfe; pfPos++)
          if (p < Math.abs(pf[pfPos])) p = Math.abs(pf[pfPos]);

        gfc.nsPsy.last_en_subshort[chn][i] = p;
        en_subshort[i + 3] = p;
        en_short[1 + i / 3] += p;
        if (p > en_subshort[i + 3 - 2]) {
          assert(en_subshort[i + 3 - 2] > 0);
          p /= en_subshort[i + 3 - 2];
        } else if (en_subshort[i + 3 - 2] > p * 10.0) {
          assert(p > 0);
          p = en_subshort[i + 3 - 2] / (p * 10.0);
        } else {
          p = 0.0;
        }
        attack_intensity[i + 3] = p;
      }

      for (let i = 0; i < 3; ++i) {
        const enn =
          en_subshort[i * 3 + 3] +
          en_subshort[i * 3 + 4] +
          en_subshort[i * 3 + 5];
        let factor = 1;
        if (en_subshort[i * 3 + 5] * 6 < enn) {
          factor *= 0.5;
          if (en_subshort[i * 3 + 4] * 6 < enn) {
            factor *= 0.5;
          }
        }
        sub_short_factor[chn][i] = factor;
      }

      for (let i = 0; i < 12; i++) {
        if (
          ns_attacks[chn][i / 3] === 0 &&
          attack_intensity[i] > attackThreshold
        ) {
          ns_attacks[chn][i / 3] = (i % 3) + 1;
        }
      }

      for (let i = 1; i < 4; i++) {
        const u = en_short[i - 1];
        const v = en_short[i];
        const m = Math.max(u, v);
        if (m < 40000) {
          if (u < 1.7 * v && v < 1.7 * u) {
            if (i === 1 && ns_attacks[chn][0] <= ns_attacks[chn][i]) {
              ns_attacks[chn][0] = 0;
            }
            ns_attacks[chn][i] = 0;
          }
        }
      }

      if (ns_attacks[chn][0] <= gfc.nsPsy.lastAttacks[chn]) {
        ns_attacks[chn][0] = 0;
      }

      if (
        gfc.nsPsy.lastAttacks[chn] === 3 ||
        ns_attacks[chn][0] +
          ns_attacks[chn][1] +
          ns_attacks[chn][2] +
          ns_attacks[chn][3] !==
          0
      ) {
        ns_uselongblock = 0;

        if (ns_attacks[chn][1] !== 0 && ns_attacks[chn][0] !== 0) {
          ns_attacks[chn][1] = 0;
        }
        if (ns_attacks[chn][2] !== 0 && ns_attacks[chn][1] !== 0) {
          ns_attacks[chn][2] = 0;
        }
        if (ns_attacks[chn][3] !== 0 && ns_attacks[chn][2] !== 0) {
          ns_attacks[chn][3] = 0;
        }
      }
      if (chn < 2) {
        uselongblock[chn] = ns_uselongblock;
      } else if (ns_uselongblock === 0) {
        uselongblock[0] = 0;
        uselongblock[1] = 0;
      }

      energy[chn] = gfc.tot_ener[chn];
    }
  }

  private vbrpsy_skip_masking_s(
    gfc: LameInternalFlags,
    chn: number,
    sblock: number,
  ) {
    if (sblock === 0) {
      for (let b = 0; b < gfc.npart_s; b++) {
        gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
        gfc.nb_s1[chn][b] = 0;
      }
    }
  }

  private vbrpsy_skip_masking_l(gfc: LameInternalFlags, chn: number) {
    for (let b = 0; b < gfc.npart_l; b++) {
      gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
      gfc.nb_1[chn][b] = 0;
    }
  }

  private psyvbr_calc_mask_index_s(
    gfc: LameInternalFlags,
    max: number[],
    avg: Float32Array,
    mask_idx: number[],
  ) {
    const last_tab_entry = this.tab.length - 1;
    let b = 0;
    let a = avg[b] + avg[b + 1];
    assert(a >= 0);
    if (a > 0.0) {
      let m = max[b];
      if (m < max[b + 1]) m = max[b + 1];
      assert(gfc.numlines_s[b] + gfc.numlines_s[b + 1] - 1 > 0);
      a =
        (20.0 * (m * 2.0 - a)) /
        (a * (gfc.numlines_s[b] + gfc.numlines_s[b + 1] - 1));
      let k = Math.trunc(a);
      if (k > last_tab_entry) k = last_tab_entry;
      mask_idx[b] = k;
    } else {
      mask_idx[b] = 0;
    }

    for (b = 1; b < gfc.npart_s - 1; b++) {
      a = avg[b - 1] + avg[b] + avg[b + 1];
      assert(b + 1 < gfc.npart_s);
      assert(a >= 0);
      if (a > 0.0) {
        let m = max[b - 1];
        if (m < max[b]) m = max[b];
        if (m < max[b + 1]) m = max[b + 1];
        assert(
          gfc.numlines_s[b - 1] +
            gfc.numlines_s[b] +
            gfc.numlines_s[b + 1] -
            1 >
            0,
        );
        a =
          (20.0 * (m * 3.0 - a)) /
          (a *
            (gfc.numlines_s[b - 1] +
              gfc.numlines_s[b] +
              gfc.numlines_s[b + 1] -
              1));
        let k = Math.trunc(a);
        if (k > last_tab_entry) k = last_tab_entry;
        mask_idx[b] = k;
      } else {
        mask_idx[b] = 0;
      }
    }
    assert(b > 0);
    assert(b === gfc.npart_s - 1);

    a = avg[b - 1] + avg[b];
    assert(a >= 0);
    if (a > 0.0) {
      let m = max[b - 1];
      if (m < max[b]) m = max[b];
      assert(gfc.numlines_s[b - 1] + gfc.numlines_s[b] - 1 > 0);
      a =
        (20.0 * (m * 2.0 - a)) /
        (a * (gfc.numlines_s[b - 1] + gfc.numlines_s[b] - 1));
      let k = Math.trunc(a);
      if (k > last_tab_entry) k = last_tab_entry;
      mask_idx[b] = k;
    } else {
      mask_idx[b] = 0;
    }
    assert(b === gfc.npart_s - 1);
  }

  private vbrpsy_compute_masking_s(
    gfp: LameGlobalFlags,
    fftenergy_s: Float32Array[],
    eb: Float32Array,
    thr: Float32Array,
    chn: number,
    sblock: number,
  ) {
    const gfc = gfp.internal_flags;
    const max = new Array<number>(CBANDS);
    const avg = new Float32Array(CBANDS);
    let i;
    let j = 0;
    let b = 0;
    const mask_idx_s = new Array<number>(CBANDS);

    for (; b < gfc.npart_s; ++b) {
      let ebb = 0;
      let m = 0;
      const n = gfc.numlines_s[b];
      for (i = 0; i < n; ++i, ++j) {
        const el = fftenergy_s[sblock][j];
        ebb += el;
        if (m < el) m = el;
      }
      eb[b] = ebb;
      assert(ebb >= 0);
      max[b] = m;
      assert(n > 0);
      avg[b] = ebb / n;
      assert(avg[b] >= 0);
    }
    assert(b === gfc.npart_s);
    assert(j === 129);
    for (; b < CBANDS; ++b) {
      max[b] = 0;
      avg[b] = 0;
    }
    j = 0;
    b = 0;
    this.psyvbr_calc_mask_index_s(gfc, max, avg, mask_idx_s);
    assert(gfc.s3_ss !== null);
    for (; b < gfc.npart_s; b++) {
      let kk = gfc.s3ind_s[b][0];
      const last = gfc.s3ind_s[b][1];
      let dd;
      let dd_n;
      let x;
      let ecb;
      dd = mask_idx_s[kk];
      dd_n = 1;
      ecb = gfc.s3_ss[j] * eb[kk] * this.tab[mask_idx_s[kk]];
      ++j;
      ++kk;
      while (kk <= last) {
        dd += mask_idx_s[kk];
        dd_n += 1;
        x = gfc.s3_ss[j] * eb[kk] * this.tab[mask_idx_s[kk]];
        ecb = this.vbrpsy_mask_add(ecb, x, kk - b);
        ++j;
        ++kk;
      }
      dd = (1 + 2 * dd) / (2 * dd_n);
      const avg_mask = this.tab[dd] * 0.5;
      ecb *= avg_mask;
      thr[b] = ecb;
      gfc.nb_s2[chn][b] = gfc.nb_s1[chn][b];
      gfc.nb_s1[chn][b] = ecb;

      x = max[b];
      x *= gfc.minval_s[b];
      x *= avg_mask;
      if (thr[b] > x) {
        thr[b] = x;
      }

      if (gfc.masking_lower > 1) {
        thr[b] *= gfc.masking_lower;
      }
      if (thr[b] > eb[b]) {
        thr[b] = eb[b];
      }
      if (gfc.masking_lower < 1) {
        thr[b] *= gfc.masking_lower;
      }

      assert(thr[b] >= 0);
    }
    for (; b < CBANDS; ++b) {
      eb[b] = 0;
      thr[b] = 0;
    }
  }

  private vbrpsy_compute_masking_l(
    gfc: LameInternalFlags,
    fftenergy: Float32Array,
    eb_l: Float32Array,
    thr: Float32Array,
    chn: number,
  ) {
    const max = new Float32Array(CBANDS);
    const avg = new Float32Array(CBANDS);
    const mask_idx_l = new Int32Array(CBANDS + 2);
    let b;

    this.calc_energy(gfc, fftenergy, eb_l, max, avg);
    this.calc_mask_index_l(gfc, max, avg, mask_idx_l);

    let k = 0;
    assert(gfc.s3_ll !== null);
    for (b = 0; b < gfc.npart_l; b++) {
      let x;
      let ecb;
      let t;

      let kk = gfc.s3ind[b][0];
      const last = gfc.s3ind[b][1];
      let dd = 0;
      let dd_n = 0;
      dd = mask_idx_l[kk];
      dd_n += 1;
      ecb = gfc.s3_ll[k] * eb_l[kk] * this.tab[mask_idx_l[kk]];
      ++k;
      ++kk;
      while (kk <= last) {
        dd += mask_idx_l[kk];
        dd_n += 1;
        x = gfc.s3_ll[k] * eb_l[kk] * this.tab[mask_idx_l[kk]];
        t = this.vbrpsy_mask_add(ecb, x, kk - b);
        ecb = t;
        ++k;
        ++kk;
      }
      dd = (1 + 2 * dd) / (2 * dd_n);
      const avg_mask = this.tab[dd] * 0.5;
      ecb *= avg_mask;

      if (gfc.blocktype_old[chn & 0x01] === SHORT_TYPE) {
        const ecb_limit = this.rpelev * gfc.nb_1[chn][b];
        if (ecb_limit > 0) {
          thr[b] = Math.min(ecb, ecb_limit);
        } else {
          thr[b] = Math.min(ecb, eb_l[b] * PsyModel.NS_PREECHO_ATT2);
        }
      } else {
        let ecb_limit_2 = this.rpelev2 * gfc.nb_2[chn][b];
        let ecb_limit_1 = this.rpelev * gfc.nb_1[chn][b];
        let ecb_limit;
        if (ecb_limit_2 <= 0) {
          ecb_limit_2 = ecb;
        }
        if (ecb_limit_1 <= 0) {
          ecb_limit_1 = ecb;
        }
        if (gfc.blocktype_old[chn & 0x01] === NORM_TYPE) {
          ecb_limit = Math.min(ecb_limit_1, ecb_limit_2);
        } else {
          ecb_limit = ecb_limit_1;
        }
        thr[b] = Math.min(ecb, ecb_limit);
      }
      gfc.nb_2[chn][b] = gfc.nb_1[chn][b];
      gfc.nb_1[chn][b] = ecb;

      x = max[b];
      x *= gfc.minval_l[b];
      x *= avg_mask;
      if (thr[b] > x) {
        thr[b] = x;
      }

      if (gfc.masking_lower > 1) {
        thr[b] *= gfc.masking_lower;
      }
      if (thr[b] > eb_l[b]) {
        thr[b] = eb_l[b];
      }
      if (gfc.masking_lower < 1) {
        thr[b] *= gfc.masking_lower;
      }
      assert(thr[b] >= 0);
    }
    for (; b < CBANDS; ++b) {
      eb_l[b] = 0;
      thr[b] = 0;
    }
  }

  private vbrpsy_compute_block_type(
    gfp: LameGlobalFlags,
    uselongblock: Int32Array,
  ) {
    const gfc = gfp.internal_flags;

    if (
      gfp.short_blocks === ShortBlock.short_block_coupled &&
      !(uselongblock[0] !== 0 && uselongblock[1] !== 0)
    ) {
      uselongblock[0] = 0;
      uselongblock[1] = 0;
    }

    for (let chn = 0; chn < gfc.channels_out; chn++) {
      if (gfp.short_blocks === ShortBlock.short_block_dispensed) {
        uselongblock[chn] = 1;
      }
      if (gfp.short_blocks === ShortBlock.short_block_forced) {
        uselongblock[chn] = 0;
      }
    }
  }

  private vbrpsy_apply_block_type(
    gfp: LameGlobalFlags,
    uselongblock: Int32Array,
    blocktype_d: Int32Array,
  ) {
    const gfc = gfp.internal_flags;

    for (let chn = 0; chn < gfc.channels_out; chn++) {
      let blocktype = NORM_TYPE;

      if (uselongblock[chn] !== 0) {
        assert(gfc.blocktype_old[chn] !== START_TYPE);
        if (gfc.blocktype_old[chn] === SHORT_TYPE) blocktype = STOP_TYPE;
      } else {
        blocktype = SHORT_TYPE;
        if (gfc.blocktype_old[chn] === NORM_TYPE) {
          gfc.blocktype_old[chn] = START_TYPE;
        }
        if (gfc.blocktype_old[chn] === STOP_TYPE)
          gfc.blocktype_old[chn] = SHORT_TYPE;
      }

      blocktype_d[chn] = gfc.blocktype_old[chn];

      gfc.blocktype_old[chn] = blocktype;
    }
  }

  private vbrpsy_compute_MS_thresholds(
    eb: Float32Array[],
    thr: Float32Array[],
    cb_mld: Float32Array,
    ath_cb: Float32Array,
    athadjust: number,
    msfix: number,
    n: number,
  ) {
    const msfix2 = msfix * 2;
    const athlower = msfix > 0 ? Math.pow(10, athadjust) : 1;
    let rside;
    let rmid;
    for (let b = 0; b < n; ++b) {
      const ebM = eb[2][b];
      const ebS = eb[3][b];
      const thmL = thr[0][b];
      const thmR = thr[1][b];
      let thmM = thr[2][b];
      let thmS = thr[3][b];

      if (thmL <= 1.58 * thmR && thmR <= 1.58 * thmL) {
        const mld_m = cb_mld[b] * ebS;
        const mld_s = cb_mld[b] * ebM;
        rmid = Math.max(thmM, Math.min(thmS, mld_m));
        rside = Math.max(thmS, Math.min(thmM, mld_s));
      } else {
        rmid = thmM;
        rside = thmS;
      }
      if (msfix > 0) {
        const ath = ath_cb[b] * athlower;
        const thmLR = Math.min(Math.max(thmL, ath), Math.max(thmR, ath));
        thmM = Math.max(rmid, ath);
        thmS = Math.max(rside, ath);
        const thmMS = thmM + thmS;
        if (thmMS > 0 && thmLR * msfix2 < thmMS) {
          const f = (thmLR * msfix2) / thmMS;
          thmM *= f;
          thmS *= f;
          assert(thmMS > 0);
        }
        rmid = Math.min(thmM, rmid);
        rside = Math.min(thmS, rside);
      }
      if (rmid > ebM) {
        rmid = ebM;
      }
      if (rside > ebS) {
        rside = ebS;
      }
      thr[2][b] = rmid;
      thr[3][b] = rside;
    }
  }

  // eslint-disable-next-line complexity
  L3psycho_anal_vbr(
    gfp: LameGlobalFlags,
    buffer: Float32Array[],
    bufPos: number,
    gr_out: number,
    masking_ratio: III_psy_ratio[][],
    masking_MS_ratio: III_psy_ratio[][],
    percep_entropy: number[],
    percep_MS_entropy: number[],
    energy: Float32Array,
    blocktype_d: Int32Array,
  ) {
    const gfc = gfp.internal_flags;

    let wsamp_l;
    let wsamp_s;
    const fftenergy = new Float32Array(HBLKSIZE);
    const fftenergy_s = Array.from(
      { length: 3 },
      () => new Float32Array(HBLKSIZE_s),
    );
    const wsamp_L = Array.from({ length: 2 }, () => new Float32Array(BLKSIZE));
    const wsamp_S = Array.from({ length: 2 }, () =>
      Array.from({ length: 3 }, () => new Float32Array(BLKSIZE_s)),
    );
    const eb = Array.from({ length: 4 }, () => new Float32Array(CBANDS));
    const thr = Array.from({ length: 4 }, () => new Float32Array(CBANDS));
    const sub_short_factor = Array.from(
      { length: 4 },
      () => new Float32Array(3),
    );
    const pcfact = 0.6;

    const ns_attacks = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const uselongblock = new Int32Array(2);

    const n_chn_psy = gfp.mode === MPEGMode.JOINT_STEREO ? 4 : gfc.channels_out;

    this.vbrpsy_attack_detection(
      gfp,
      buffer,
      bufPos,
      gr_out,
      masking_ratio,
      masking_MS_ratio,
      energy,
      sub_short_factor,
      ns_attacks,
      uselongblock,
    );

    this.vbrpsy_compute_block_type(gfp, uselongblock);

    for (let chn = 0; chn < n_chn_psy; chn++) {
      const ch01 = chn & 0x01;
      wsamp_l = wsamp_L;
      this.vbrpsy_compute_fft_l(
        gfp,
        buffer,
        bufPos,
        chn,
        fftenergy,
        wsamp_l,
        ch01,
      );

      this.vbrpsy_compute_loudness_approximation_l(gfp, gr_out, chn, fftenergy);

      if (uselongblock[ch01] !== 0) {
        this.vbrpsy_compute_masking_l(gfc, fftenergy, eb[chn], thr[chn], chn);
      } else {
        this.vbrpsy_skip_masking_l(gfc, chn);
      }
    }
    if (uselongblock[0] + uselongblock[1] === 2) {
      if (gfp.mode === MPEGMode.JOINT_STEREO) {
        this.vbrpsy_compute_MS_thresholds(
          eb,
          thr,
          gfc.mld_cb_l,
          gfc.ATH.cb_l,
          gfp.ATHlower * gfc.ATH.adjust,
          gfp.msfix,
          gfc.npart_l,
        );
      }
    }

    for (let chn = 0; chn < n_chn_psy; chn++) {
      const ch01 = chn & 0x01;
      if (uselongblock[ch01] !== 0) {
        this.convert_partition2scalefac_l(gfc, eb[chn], thr[chn], chn);
      }
    }

    for (let sblock = 0; sblock < 3; sblock++) {
      for (let chn = 0; chn < n_chn_psy; ++chn) {
        const ch01 = chn & 0x01;

        if (uselongblock[ch01] !== 0) {
          this.vbrpsy_skip_masking_s(gfc, chn, sblock);
        } else {
          wsamp_s = wsamp_S;
          this.vbrpsy_compute_fft_s(
            gfp,
            buffer,
            bufPos,
            chn,
            sblock,
            fftenergy_s,
            wsamp_s,
            ch01,
          );
          this.vbrpsy_compute_masking_s(
            gfp,
            fftenergy_s,
            eb[chn],
            thr[chn],
            chn,
            sblock,
          );
        }
      }
      if (uselongblock[0] + uselongblock[1] === 0) {
        if (gfp.mode === MPEGMode.JOINT_STEREO) {
          this.vbrpsy_compute_MS_thresholds(
            eb,
            thr,
            gfc.mld_cb_s,
            gfc.ATH.cb_s,
            gfp.ATHlower * gfc.ATH.adjust,
            gfp.msfix,
            gfc.npart_s,
          );
        }
      }

      for (let chn = 0; chn < n_chn_psy; ++chn) {
        const ch01 = chn & 0x01;
        if (uselongblock[ch01] === 0) {
          this.convert_partition2scalefac_s(
            gfc,
            eb[chn],
            thr[chn],
            chn,
            sblock,
          );
        }
      }
    }

    for (let chn = 0; chn < n_chn_psy; chn++) {
      const ch01 = chn & 0x01;

      if (uselongblock[ch01] !== 0) {
        continue;
      }
      for (let sb = 0; sb < SBMAX_s; sb++) {
        const new_thmm = new Float32Array(3);
        for (let sblock = 0; sblock < 3; sblock++) {
          let thmm = gfc.thm[chn].s[sb][sblock];
          thmm *= PsyModel.NS_PREECHO_ATT0;

          if (
            ns_attacks[chn][sblock] >= 2 ||
            ns_attacks[chn][sblock + 1] === 1
          ) {
            const idx = sblock !== 0 ? sblock - 1 : 2;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT1 * pcfact,
            );
            thmm = Math.min(thmm, p);
          } else if (ns_attacks[chn][sblock] === 1) {
            const idx = sblock !== 0 ? sblock - 1 : 2;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT2 * pcfact,
            );
            thmm = Math.min(thmm, p);
          } else if (
            (sblock !== 0 && ns_attacks[chn][sblock - 1] === 3) ||
            (sblock === 0 && gfc.nsPsy.lastAttacks[chn] === 3)
          ) {
            const idx = sblock !== 2 ? sblock + 1 : 0;
            const p = this.nsInterp(
              gfc.thm[chn].s[sb][idx],
              thmm,
              PsyModel.NS_PREECHO_ATT2 * pcfact,
            );
            thmm = Math.min(thmm, p);
          }

          thmm *= sub_short_factor[chn][sblock];

          new_thmm[sblock] = thmm;
        }
        for (let sblock = 0; sblock < 3; sblock++) {
          gfc.thm[chn].s[sb][sblock] = new_thmm[sblock];
        }
      }
    }

    for (let chn = 0; chn < n_chn_psy; chn++) {
      gfc.nsPsy.lastAttacks[chn] = ns_attacks[chn][2];
    }

    this.vbrpsy_apply_block_type(gfp, uselongblock, blocktype_d);

    for (let chn = 0; chn < n_chn_psy; chn++) {
      let ppe;
      let ppePos;
      let type;
      let mr;

      if (chn > 1) {
        ppe = percep_MS_entropy;
        ppePos = -2;
        type = NORM_TYPE;
        if (blocktype_d[0] === SHORT_TYPE || blocktype_d[1] === SHORT_TYPE)
          type = SHORT_TYPE;
        mr = masking_MS_ratio[gr_out][chn - 2];
      } else {
        ppe = percep_entropy;
        ppePos = 0;
        type = blocktype_d[chn];
        mr = masking_ratio[gr_out][chn];
      }

      if (type === SHORT_TYPE) {
        ppe[ppePos + chn] = this.pecalc_s(mr, gfc.masking_lower);
      } else {
        ppe[ppePos + chn] = this.pecalc_l(mr, gfc.masking_lower);
      }
    }
    return 0;
  }

  private s3_func_x(bark: number, hf_slope: number) {
    const tempx = bark;
    let tempy;

    if (tempx >= 0) {
      tempy = -tempx * 27;
    } else {
      tempy = tempx * hf_slope;
    }
    if (tempy <= -72.0) {
      return 0;
    }
    return Math.exp(tempy * PsyModel.LN_TO_LOG10);
  }

  private norm_s3_func_x(hf_slope: number) {
    let lim_a = 0;
    let lim_b = 0;

    let x = 0;
    let l;
    let h;
    for (x = 0; this.s3_func_x(x, hf_slope) > 1e-20; x -= 1);
    l = x;
    h = 0;
    while (Math.abs(h - l) > 1e-12) {
      x = (h + l) / 2;
      if (this.s3_func_x(x, hf_slope) > 0) {
        h = x;
      } else {
        l = x;
      }
    }
    lim_a = l;

    for (x = 0; this.s3_func_x(x, hf_slope) > 1e-20; x += 1);
    l = 0;
    h = x;
    while (Math.abs(h - l) > 1e-12) {
      x = (h + l) / 2;
      if (this.s3_func_x(x, hf_slope) > 0) {
        l = x;
      } else {
        h = x;
      }
    }
    lim_b = h;

    let sum = 0;
    const m = 1000;
    let i;
    for (i = 0; i <= m; ++i) {
      const x = lim_a + (i * (lim_b - lim_a)) / m;
      const y = this.s3_func_x(x, hf_slope);
      sum += y;
    }

    const norm = (m + 1) / (sum * (lim_b - lim_a));

    return norm;
  }

  private s3_func(bark: number) {
    let tempx;
    let x;
    let temp;
    tempx = bark;
    if (tempx >= 0) tempx *= 3;
    else tempx *= 1.5;

    if (tempx >= 0.5 && tempx <= 2.5) {
      temp = tempx - 0.5;
      x = 8.0 * (temp * temp - 2.0 * temp);
    } else x = 0.0;
    tempx += 0.474;
    const tempy =
      15.811389 + 7.5 * tempx - 17.5 * Math.sqrt(1.0 + tempx * tempx);

    if (tempy <= -60.0) return 0.0;

    tempx = Math.exp((x + tempy) * PsyModel.LN_TO_LOG10);

    tempx /= 0.6609193;
    return tempx;
  }

  private freq2bark(freq: number) {
    if (freq < 0) freq = 0;
    freq *= 0.001;
    return (
      13.0 * Math.atan(0.76 * freq) +
      3.5 * Math.atan((freq * freq) / (7.5 * 7.5))
    );
  }

  private init_numline(
    numlines: Int32Array,
    bo: Int32Array,
    bm: Int32Array,
    bval: Float32Array,
    bval_width: Float32Array,
    mld: Float32Array,
    bo_w: Float32Array,
    sfreq: number,
    blksize: number,
    scalepos: Int32Array,
    deltafreq: number,
    sbmax: number,
  ) {
    const b_frq = new Float32Array(CBANDS + 1);
    const sample_freq_frac = sfreq / (sbmax > 15 ? 2 * 576 : 2 * 192);
    const partition = new Int32Array(HBLKSIZE);
    let i;
    sfreq /= blksize;
    let j = 0;
    let ni = 0;

    for (i = 0; i < CBANDS; i++) {
      let j2;
      const bark1 = this.freq2bark(sfreq * j);

      b_frq[i] = sfreq * j;

      for (
        j2 = j;
        this.freq2bark(sfreq * j2) - bark1 < PsyModel.DELBARK &&
        j2 <= blksize / 2;
        j2++
      );

      numlines[i] = j2 - j;
      ni = i + 1;

      while (j < j2) {
        assert(j < HBLKSIZE);
        partition[j++] = i;
      }
      if (j > blksize / 2) {
        j = blksize / 2;
        ++i;
        break;
      }
    }
    assert(i < CBANDS);
    b_frq[i] = sfreq * j;

    for (let sfb = 0; sfb < sbmax; sfb++) {
      let i1;
      let i2;
      let arg;
      const start = scalepos[sfb];
      const end = scalepos[sfb + 1];

      i1 = Math.floor(0.5 + deltafreq * (start - 0.5));
      if (i1 < 0) i1 = 0;
      i2 = Math.floor(0.5 + deltafreq * (end - 0.5));

      if (i2 > blksize / 2) i2 = blksize / 2;

      bm[sfb] = (partition[i1] + partition[i2]) / 2;
      bo[sfb] = partition[i2];
      const f_tmp = sample_freq_frac * end;

      bo_w[sfb] =
        (f_tmp - b_frq[bo[sfb]]) / (b_frq[bo[sfb] + 1] - b_frq[bo[sfb]]);
      if (bo_w[sfb] < 0) {
        bo_w[sfb] = 0;
      } else if (bo_w[sfb] > 1) {
        bo_w[sfb] = 1;
      }

      arg = this.freq2bark(sfreq * scalepos[sfb] * deltafreq);
      arg = Math.min(arg, 15.5) / 15.5;

      mld[sfb] = Math.pow(10.0, 1.25 * (1 - Math.cos(Math.PI * arg)) - 2.5);
    }

    j = 0;
    for (let k = 0; k < ni; k++) {
      const w = numlines[k];
      let bark1;
      let bark2;

      bark1 = this.freq2bark(sfreq * j);
      bark2 = this.freq2bark(sfreq * (j + w - 1));
      bval[k] = 0.5 * (bark1 + bark2);

      bark1 = this.freq2bark(sfreq * (j - 0.5));
      bark2 = this.freq2bark(sfreq * (j + w - 0.5));
      bval_width[k] = bark2 - bark1;
      j += w;
    }

    return ni;
  }

  private init_s3_values(
    s3ind: Int32Array[],
    npart: number,
    bval: Float32Array,
    bval_width: Float32Array,
    norm: Float32Array,
    use_old_s3: boolean,
  ) {
    const s3 = Array.from({ length: CBANDS }, () => new Float32Array(CBANDS));

    let j;
    let numberOfNoneZero = 0;

    if (use_old_s3) {
      for (let i = 0; i < npart; i++) {
        for (j = 0; j < npart; j++) {
          const v = this.s3_func(bval[i] - bval[j]) * bval_width[j];
          s3[i][j] = v * norm[i];
        }
      }
    } else {
      for (j = 0; j < npart; j++) {
        const hf_slope = 15 + Math.min(21 / bval[j], 12);
        const s3_x_norm = this.norm_s3_func_x(hf_slope);
        for (let i = 0; i < npart; i++) {
          const v =
            s3_x_norm *
            this.s3_func_x(bval[i] - bval[j], hf_slope) *
            bval_width[j];
          s3[i][j] = v * norm[i];
        }
      }
    }
    for (let i = 0; i < npart; i++) {
      for (j = 0; j < npart; j++) {
        if (s3[i][j] > 0.0) break;
      }
      s3ind[i][0] = j;

      for (j = npart - 1; j > 0; j--) {
        if (s3[i][j] > 0.0) break;
      }
      s3ind[i][1] = j;
      numberOfNoneZero += s3ind[i][1] - s3ind[i][0] + 1;
    }

    const p = new Float32Array(numberOfNoneZero);
    let k = 0;
    for (let i = 0; i < npart; i++)
      for (j = s3ind[i][0]; j <= s3ind[i][1]; j++) p[k++] = s3[i][j];

    return p;
  }

  private stereo_demask(f: number) {
    let arg = this.freq2bark(f);
    arg = Math.min(arg, 15.5) / 15.5;

    return Math.pow(10.0, 1.25 * (1 - Math.cos(Math.PI * arg)) - 2.5);
  }

  // eslint-disable-next-line complexity
  psymodel_init(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;
    let i;
    const useOldS3 = true;
    const bvl_a = 13;
    const bvl_b = 24;
    const snr_l_a = 0;
    const snr_l_b = 0;
    const snr_s_a = -8.25;
    const snr_s_b = -4.5;
    const bval = new Float32Array(CBANDS);
    const bval_width = new Float32Array(CBANDS);
    const norm = new Float32Array(CBANDS);
    const sfreq = gfp.out_samplerate;

    gfc.ms_ener_ratio_old = 0.25;
    gfc.blocktype_old[0] = NORM_TYPE;
    gfc.blocktype_old[1] = NORM_TYPE;

    for (i = 0; i < 4; ++i) {
      for (let j = 0; j < CBANDS; ++j) {
        gfc.nb_1[i][j] = 1e20;
        gfc.nb_2[i][j] = 1e20;
        gfc.nb_s1[i][j] = 1.0;
        gfc.nb_s2[i][j] = 1.0;
      }
      for (let sb = 0; sb < SBMAX_l; sb++) {
        gfc.en[i].l[sb] = 1e20;
        gfc.thm[i].l[sb] = 1e20;
      }
      for (let j = 0; j < 3; ++j) {
        for (let sb = 0; sb < SBMAX_s; sb++) {
          gfc.en[i].s[sb][j] = 1e20;
          gfc.thm[i].s[sb][j] = 1e20;
        }
        gfc.nsPsy.lastAttacks[i] = 0;
      }
      for (let j = 0; j < 9; j++) gfc.nsPsy.last_en_subshort[i][j] = 10;
    }

    gfc.loudness_sq_save[0] = 0.0;
    gfc.loudness_sq_save[1] = 0.0;

    gfc.npart_l = this.init_numline(
      gfc.numlines_l,
      gfc.bo_l,
      gfc.bm_l,
      bval,
      bval_width,
      gfc.mld_l,
      gfc.PSY.bo_l_weight,
      sfreq,
      BLKSIZE,
      gfc.scalefac_band.l,
      BLKSIZE / (2.0 * 576),
      SBMAX_l,
    );
    assert(gfc.npart_l < CBANDS);

    for (i = 0; i < gfc.npart_l; i++) {
      let snr = snr_l_a;
      if (bval[i] >= bvl_a) {
        snr =
          (snr_l_b * (bval[i] - bvl_a)) / (bvl_b - bvl_a) +
          (snr_l_a * (bvl_b - bval[i])) / (bvl_b - bvl_a);
      }
      norm[i] = Math.pow(10.0, snr / 10.0);
      if (gfc.numlines_l[i] > 0) {
        gfc.rnumlines_l[i] = 1.0 / gfc.numlines_l[i];
      } else {
        gfc.rnumlines_l[i] = 0;
      }
    }
    gfc.s3_ll = this.init_s3_values(
      gfc.s3ind,
      gfc.npart_l,
      bval,
      bval_width,
      norm,
      useOldS3,
    );

    let j = 0;
    for (i = 0; i < gfc.npart_l; i++) {
      let x;

      x = MAX_FLOAT32_VALUE;
      for (let k = 0; k < gfc.numlines_l[i]; k++, j++) {
        const freq = (sfreq * j) / (1000.0 * BLKSIZE);
        let level;

        level = this.ATHformula(freq * 1000, gfp) - 20;

        level = Math.pow(10, 0.1 * level);

        level *= gfc.numlines_l[i];
        if (x > level) x = level;
      }
      gfc.ATH.cb_l[i] = x;

      x = -20 + (bval[i] * 20) / 10;
      if (x > 6) {
        x = 100;
      }
      if (x < -15) {
        x = -15;
      }
      x -= 8;
      gfc.minval_l[i] = Math.pow(10.0, x / 10) * gfc.numlines_l[i];
    }

    gfc.npart_s = this.init_numline(
      gfc.numlines_s,
      gfc.bo_s,
      gfc.bm_s,
      bval,
      bval_width,
      gfc.mld_s,
      gfc.PSY.bo_s_weight,
      sfreq,
      BLKSIZE_s,
      gfc.scalefac_band.s,
      BLKSIZE_s / (2.0 * 192),
      SBMAX_s,
    );
    assert(gfc.npart_s < CBANDS);

    j = 0;
    for (i = 0; i < gfc.npart_s; i++) {
      let x;
      let snr = snr_s_a;
      if (bval[i] >= bvl_a) {
        snr =
          (snr_s_b * (bval[i] - bvl_a)) / (bvl_b - bvl_a) +
          (snr_s_a * (bvl_b - bval[i])) / (bvl_b - bvl_a);
      }
      norm[i] = Math.pow(10.0, snr / 10.0);

      x = MAX_FLOAT32_VALUE;
      for (let k = 0; k < gfc.numlines_s[i]; k++, j++) {
        const freq = (sfreq * j) / (1000.0 * BLKSIZE_s);
        let level;

        level = this.ATHformula(freq * 1000, gfp) - 20;

        level = Math.pow(10, 0.1 * level);

        level *= gfc.numlines_s[i];
        if (x > level) x = level;
      }
      gfc.ATH.cb_s[i] = x;

      x = -7.0 + (bval[i] * 7.0) / 12.0;
      if (bval[i] > 12) {
        x *= 1 + Math.log(1 + x) * 3.1;
      }
      if (bval[i] < 12) {
        x *= 1 + Math.log(1 - x) * 2.3;
      }
      if (x < -15) {
        x = -15;
      }
      x -= 8;
      gfc.minval_s[i] = Math.pow(10.0, x / 10) * gfc.numlines_s[i];
    }

    gfc.s3_ss = this.init_s3_values(
      gfc.s3ind_s,
      gfc.npart_s,
      bval,
      bval_width,
      norm,
      useOldS3,
    );

    this.init_mask_add_max_values();
    this.fft.init();

    gfc.decay = Math.exp(
      (-1.0 * LOG10) / ((this.temporalmask_sustain_sec * sfreq) / 192.0),
    );

    {
      let msfix;
      msfix = PsyModel.NS_MSFIX;
      if ((gfp.exp_nspsytune & 2) !== 0) msfix = 1.0;
      if (Math.abs(gfp.msfix) > 0.0) msfix = gfp.msfix;
      gfp.msfix = msfix;

      for (let b = 0; b < gfc.npart_l; b++)
        if (gfc.s3ind[b][1] > gfc.npart_l - 1)
          gfc.s3ind[b][1] = gfc.npart_l - 1;
    }

    const frame_duration = (576 * gfc.mode_gr) / sfreq;
    gfc.ATH.decay = Math.pow(10, (-12 / 10) * frame_duration);
    gfc.ATH.adjust = 0.01;

    gfc.ATH.adjustLimit = 1.0;

    assert(gfc.bo_l[SBMAX_l - 1] <= gfc.npart_l);
    assert(gfc.bo_s[SBMAX_s - 1] <= gfc.npart_s);

    if (gfp.ATHtype !== -1) {
      let freq;
      const freq_inc = gfp.out_samplerate / BLKSIZE;
      let eql_balance = 0.0;
      freq = 0.0;
      for (i = 0; i < BLKSIZE / 2; ++i) {
        freq += freq_inc;
        gfc.ATH.eql_w[i] = 1 / Math.pow(10, this.ATHformula(freq, gfp) / 10);
        eql_balance += gfc.ATH.eql_w[i];
      }
      eql_balance = 1.0 / eql_balance;
      for (i = BLKSIZE / 2; --i >= 0; ) {
        gfc.ATH.eql_w[i] *= eql_balance;
      }
    }
    {
      let b = 0;
      let j = 0;
      for (; b < gfc.npart_s; ++b) {
        for (i = 0; i < gfc.numlines_s[b]; ++i) {
          ++j;
        }
      }
      assert(j === 129);
      b = 0;
      j = 0;
      for (; b < gfc.npart_l; ++b) {
        for (i = 0; i < gfc.numlines_l[b]; ++i) {
          ++j;
        }
      }
      assert(j === 513);
    }
    j = 0;
    for (i = 0; i < gfc.npart_l; i++) {
      const freq = (sfreq * (j + gfc.numlines_l[i] / 2)) / (1.0 * BLKSIZE);
      gfc.mld_cb_l[i] = this.stereo_demask(freq);
      j += gfc.numlines_l[i];
    }
    for (; i < CBANDS; ++i) {
      gfc.mld_cb_l[i] = 1;
    }
    j = 0;
    for (i = 0; i < gfc.npart_s; i++) {
      const freq = (sfreq * (j + gfc.numlines_s[i] / 2)) / (1.0 * BLKSIZE_s);
      gfc.mld_cb_s[i] = this.stereo_demask(freq);
      j += gfc.numlines_s[i];
    }
    for (; i < CBANDS; ++i) {
      gfc.mld_cb_s[i] = 1;
    }
    return 0;
  }

  private ATHformula_GB(f: number, value: number) {
    if (f < -0.3) f = 3410;

    f /= 1000;
    f = Math.max(0.1, f);
    const ath =
      3.64 * Math.pow(f, -0.8) -
      6.8 * Math.exp(-0.6 * Math.pow(f - 3.4, 2.0)) +
      6.0 * Math.exp(-0.15 * Math.pow(f - 8.7, 2.0)) +
      (0.6 + 0.04 * value) * 0.001 * Math.pow(f, 4.0);
    return ath;
  }

  ATHformula(f: number, gfp: LameGlobalFlags) {
    let ath;
    switch (gfp.ATHtype) {
      case 0:
        ath = this.ATHformula_GB(f, 9);
        break;
      case 1:
        ath = this.ATHformula_GB(f, -1);
        break;
      case 2:
        ath = this.ATHformula_GB(f, 0);
        break;
      case 3:
        ath = this.ATHformula_GB(f, 1) + 6;
        break;
      case 4:
        ath = this.ATHformula_GB(f, gfp.ATHcurve);
        break;
      default:
        ath = this.ATHformula_GB(f, 0);
        break;
    }
    return ath;
  }
}
