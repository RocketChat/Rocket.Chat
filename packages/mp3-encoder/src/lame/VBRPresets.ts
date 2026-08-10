import type { LameGlobalFlags } from './LameGlobalFlags';
import type { Quality } from './Quality';
import { VbrMode } from './VbrMode';
import { equals } from './math';

interface VBRPreset {
  readonly vbr_q: Quality;
  readonly quant_comp: 9;
  readonly quant_comp_s: 9;
  readonly expY: 0 | 1;
  readonly st_lrm: number;
  readonly st_s: number;
  readonly masking_adj: number;
  readonly masking_adj_short: number;
  readonly ath_lower: number;
  readonly ath_curve: number;
  readonly ath_sensitivity: number;
  readonly interch: number;
  readonly safejoint: number;
  readonly sfb21mod: number;
  readonly msfix: number;
}

type PresetMap = Record<Quality, VBRPreset>;

export class VBRPresets {
  private readonly oldSwitchMap = [
    {
      vbr_q: 0,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 5.2,
      st_s: 125,
      masking_adj: -4.2,
      masking_adj_short: -6.3,
      ath_lower: 4.8,
      ath_curve: 1,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 21,
      msfix: 0.97,
    },
    {
      vbr_q: 1,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 5.3,
      st_s: 125,
      masking_adj: -3.6,
      masking_adj_short: -5.6,
      ath_lower: 4.5,
      ath_curve: 1.5,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 21,
      msfix: 1.35,
    },
    {
      vbr_q: 2,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 5.6,
      st_s: 125,
      masking_adj: -2.2,
      masking_adj_short: -3.5,
      ath_lower: 2.8,
      ath_curve: 2,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 21,
      msfix: 1.49,
    },
    {
      vbr_q: 3,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 5.8,
      st_s: 130,
      masking_adj: -1.8,
      masking_adj_short: -2.8,
      ath_lower: 2.6,
      ath_curve: 3,
      ath_sensitivity: -4,
      interch: 0,
      safejoint: 2,
      sfb21mod: 20,
      msfix: 1.64,
    },
    {
      vbr_q: 4,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6,
      st_s: 135,
      masking_adj: -0.7,
      masking_adj_short: -1.1,
      ath_lower: 1.1,
      ath_curve: 3.5,
      ath_sensitivity: -8,
      interch: 0,
      safejoint: 2,
      sfb21mod: 0,
      msfix: 1.79,
    },
    {
      vbr_q: 5,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6.4,
      st_s: 140,
      masking_adj: 0.5,
      masking_adj_short: 0.4,
      ath_lower: -7.5,
      ath_curve: 4,
      ath_sensitivity: -12,
      interch: 0.0002,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 1.95,
    },
    {
      vbr_q: 6,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6.6,
      st_s: 145,
      masking_adj: 0.67,
      masking_adj_short: 0.65,
      ath_lower: -14.7,
      ath_curve: 6.5,
      ath_sensitivity: -19,
      interch: 0.0004,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2.3,
    },
    {
      vbr_q: 7,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6.6,
      st_s: 145,
      masking_adj: 0.8,
      masking_adj_short: 0.75,
      ath_lower: -19.7,
      ath_curve: 8,
      ath_sensitivity: -22,
      interch: 0.0006,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2.7,
    },
    {
      vbr_q: 8,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6.6,
      st_s: 145,
      masking_adj: 1.2,
      masking_adj_short: 1.15,
      ath_lower: -27.5,
      ath_curve: 10,
      ath_sensitivity: -23,
      interch: 0.0007,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 0,
    },
    {
      vbr_q: 9,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 6.6,
      st_s: 145,
      masking_adj: 1.6,
      masking_adj_short: 1.6,
      ath_lower: -36,
      ath_curve: 11,
      ath_sensitivity: -25,
      interch: 0.0008,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 0,
    },
  ] as const satisfies PresetMap;

  private readonly switchMap = [
    {
      vbr_q: 0,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -7,
      masking_adj_short: -4,
      ath_lower: 7.5,
      ath_curve: 1,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 26,
      msfix: 0.97,
    },
    {
      vbr_q: 1,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -5.6,
      masking_adj_short: -3.6,
      ath_lower: 4.5,
      ath_curve: 1.5,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 21,
      msfix: 1.35,
    },
    {
      vbr_q: 2,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 0,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -4.4,
      masking_adj_short: -1.8,
      ath_lower: 2,
      ath_curve: 2,
      ath_sensitivity: 0,
      interch: 0,
      safejoint: 2,
      sfb21mod: 18,
      msfix: 1.49,
    },
    {
      vbr_q: 3,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -3.4,
      masking_adj_short: -1.25,
      ath_lower: 1.1,
      ath_curve: 3,
      ath_sensitivity: -4,
      interch: 0,
      safejoint: 2,
      sfb21mod: 15,
      msfix: 1.64,
    },
    {
      vbr_q: 4,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -2.2,
      masking_adj_short: 0.1,
      ath_lower: 0,
      ath_curve: 3.5,
      ath_sensitivity: -8,
      interch: 0,
      safejoint: 2,
      sfb21mod: 0,
      msfix: 1.79,
    },
    {
      vbr_q: 5,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -1,
      masking_adj_short: 1.65,
      ath_lower: -7.7,
      ath_curve: 4,
      ath_sensitivity: -12,
      interch: 0.0002,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 1.95,
    },
    {
      vbr_q: 6,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: -0,
      masking_adj_short: 2.47,
      ath_lower: -7.7,
      ath_curve: 6.5,
      ath_sensitivity: -19,
      interch: 0.0004,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2,
    },
    {
      vbr_q: 7,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: 0.5,
      masking_adj_short: 2,
      ath_lower: -14.5,
      ath_curve: 8,
      ath_sensitivity: -22,
      interch: 0.0006,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2,
    },
    {
      vbr_q: 8,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: 1,
      masking_adj_short: 2.4,
      ath_lower: -22,
      ath_curve: 10,
      ath_sensitivity: -23,
      interch: 0.0007,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2,
    },
    {
      vbr_q: 9,
      quant_comp: 9,
      quant_comp_s: 9,
      expY: 1,
      st_lrm: 4.2,
      st_s: 25,
      masking_adj: 1.5,
      masking_adj_short: 2.95,
      ath_lower: -30,
      ath_curve: 11,
      ath_sensitivity: -25,
      interch: 0.0008,
      safejoint: 0,
      sfb21mod: 0,
      msfix: 2,
    },
  ] as const satisfies PresetMap;

  private setVBRQuality(gfp: LameGlobalFlags, VBR_q: Quality): void {
    if (VBR_q < 0) {
      VBR_q = 0;
    }

    if (VBR_q > 9) {
      VBR_q = 9;
    }

    gfp.VBR_q = VBR_q;
  }

  public apply(gfp: LameGlobalFlags, a: Quality) {
    const presetMap =
      gfp.VBR === VbrMode.vbr_rh ? this.oldSwitchMap : this.switchMap;

    const set: VBRPreset = presetMap[a];

    this.setVBRQuality(gfp, set.vbr_q);

    if (equals(gfp.quant_comp, -1)) {
      gfp.quant_comp = set.quant_comp;
    }

    if (equals(gfp.quant_comp_short, -1)) {
      gfp.quant_comp_short = set.quant_comp_s;
    }

    if (set.expY !== 0) {
      gfp.experimentalY = true;
    }

    if (equals(gfp.internal_flags.nsPsy.attackthre, -1)) {
      gfp.internal_flags.nsPsy.attackthre = set.st_lrm;
    }

    if (equals(gfp.internal_flags.nsPsy.attackthre_s, -1)) {
      gfp.internal_flags.nsPsy.attackthre_s = set.st_s;
    }

    if (equals(gfp.maskingadjust, 0)) {
      gfp.maskingadjust = set.masking_adj;
    }

    if (equals(gfp.maskingadjust_short, 0)) {
      gfp.maskingadjust_short = set.masking_adj_short;
    }

    if (equals(-gfp.ATHlower * 10.0, 0)) {
      gfp.ATHlower = -set.ath_lower / 10.0;
    }

    if (equals(gfp.ATHcurve, -1)) {
      gfp.ATHcurve = set.ath_curve;
    }

    if (equals(gfp.athaa_sensitivity, -1)) {
      gfp.athaa_sensitivity = set.ath_sensitivity;
    }

    if (set.interch > 0 && equals(gfp.interChRatio, -1)) {
      gfp.interChRatio = set.interch;
    }

    if (set.safejoint > 0) {
      gfp.exp_nspsytune |= set.safejoint;
    }

    if (set.sfb21mod > 0) {
      gfp.exp_nspsytune |= set.sfb21mod << 20;
    }

    if (equals(gfp.msfix, -1)) {
      gfp.msfix = set.msfix;
    }

    gfp.VBR_q = a;
  }
}
