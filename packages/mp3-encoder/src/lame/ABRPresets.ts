import type { LameGlobalFlags } from './LameGlobalFlags';
import { VbrMode } from './VbrMode';
import type { Bitrate } from './bitrates';
import { equals } from './math';

interface ABRPreset {
  readonly kbps: number;
  readonly quant_comp: number;
  readonly quant_comp_s: number;
  readonly safejoint: number;
  readonly nsmsfix: number;
  readonly st_lrm: number;
  readonly st_s: number;
  readonly nsbass: number;
  readonly scale: number;
  readonly masking_adj: number;
  readonly ath_lower: number;
  readonly ath_curve: number;
  readonly interch: number;
  readonly sfscale: 0 | 1;
}

interface BandPass {
  readonly bitrate: number;
  readonly lowpass: number;
}

type FullBitrateIndex = number & { __brand: 'FullBitrateIndex' };

type PresetMap = Record<FullBitrateIndex, ABRPreset>;

export class ABRPresets {
  private readonly fullBitrates = [
    8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
  ] as const satisfies readonly Bitrate[];

  private findNearestFullBitrateIndex(bitrate: number): FullBitrateIndex {
    let lowerRange = this.fullBitrates.length - 1;
    let upperRange = this.fullBitrates.length - 1;

    for (
      let maybeLowerRange = 0;
      maybeLowerRange < this.fullBitrates.length - 1;
      maybeLowerRange++
    ) {
      const maybeUpperRange = maybeLowerRange + 1;

      if (this.fullBitrates[maybeUpperRange] > bitrate) {
        lowerRange = maybeLowerRange;
        upperRange = maybeUpperRange;
        break;
      }
    }

    return bitrate - this.fullBitrates[lowerRange] <
      this.fullBitrates[upperRange] - bitrate
      ? (lowerRange as FullBitrateIndex)
      : (upperRange as FullBitrateIndex);
  }

  private readonly presetMap = [
    {
      kbps: 8,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -30,
      ath_curve: 11,
      interch: 0.0012,
      sfscale: 1,
    },
    {
      kbps: 16,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -25,
      ath_curve: 11,
      interch: 0.001,
      sfscale: 1,
    },
    {
      kbps: 24,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -20,
      ath_curve: 11,
      interch: 0.001,
      sfscale: 1,
    },
    {
      kbps: 32,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -15,
      ath_curve: 11,
      interch: 0.001,
      sfscale: 1,
    },
    {
      kbps: 40,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -10,
      ath_curve: 11,
      interch: 0.0009,
      sfscale: 1,
    },
    {
      kbps: 48,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -10,
      ath_curve: 11,
      interch: 0.0009,
      sfscale: 1,
    },
    {
      kbps: 56,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -6,
      ath_curve: 11,
      interch: 0.0008,
      sfscale: 1,
    },
    {
      kbps: 64,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: -2,
      ath_curve: 11,
      interch: 0.0008,
      sfscale: 1,
    },
    {
      kbps: 80,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 0,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: 0,
      ath_curve: 8,
      interch: 0.0007,
      sfscale: 1,
    },
    {
      kbps: 96,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 2.5,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: 1,
      ath_curve: 5.5,
      interch: 0.0006,
      sfscale: 1,
    },
    {
      kbps: 112,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 2.25,
      st_lrm: 6.6,
      st_s: 145,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: 2,
      ath_curve: 4.5,
      interch: 0.0005,
      sfscale: 1,
    },
    {
      kbps: 128,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 0,
      nsmsfix: 1.95,
      st_lrm: 6.4,
      st_s: 140,
      nsbass: 0,
      scale: 0.95,
      masking_adj: 0,
      ath_lower: 3,
      ath_curve: 4,
      interch: 0.0002,
      sfscale: 1,
    },
    {
      kbps: 160,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 1,
      nsmsfix: 1.79,
      st_lrm: 6,
      st_s: 135,
      nsbass: 0,
      scale: 0.95,
      masking_adj: -2,
      ath_lower: 5,
      ath_curve: 3.5,
      interch: 0,
      sfscale: 1,
    },
    {
      kbps: 192,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 1,
      nsmsfix: 1.49,
      st_lrm: 5.6,
      st_s: 125,
      nsbass: 0,
      scale: 0.97,
      masking_adj: -4,
      ath_lower: 7,
      ath_curve: 3,
      interch: 0,
      sfscale: 0,
    },
    {
      kbps: 224,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 1,
      nsmsfix: 1.25,
      st_lrm: 5.2,
      st_s: 125,
      nsbass: 0,
      scale: 0.98,
      masking_adj: -6,
      ath_lower: 9,
      ath_curve: 2,
      interch: 0,
      sfscale: 0,
    },
    {
      kbps: 256,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 1,
      nsmsfix: 0.97,
      st_lrm: 5.2,
      st_s: 125,
      nsbass: 0,
      scale: 1,
      masking_adj: -8,
      ath_lower: 10,
      ath_curve: 1,
      interch: 0,
      sfscale: 0,
    },
    {
      kbps: 320,
      quant_comp: 9,
      quant_comp_s: 9,
      safejoint: 1,
      nsmsfix: 0.9,
      st_lrm: 5.2,
      st_s: 125,
      nsbass: 0,
      scale: 1,
      masking_adj: -10,
      ath_lower: 12,
      ath_curve: 0,
      interch: 0,
      sfscale: 0,
    },
  ] as const satisfies PresetMap;

  public apply(gfp: LameGlobalFlags, bitrate: number) {
    const preset = this.presetMap[this.findNearestFullBitrateIndex(bitrate)];

    gfp.VBR = VbrMode.vbr_abr;
    gfp.VBR_mean_bitrate_kbps = bitrate;
    gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps, 320);
    gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps, 8);
    gfp.brate = gfp.VBR_mean_bitrate_kbps;

    if (preset.safejoint > 0) {
      gfp.exp_nspsytune |= 2;
    }

    if (preset.sfscale > 0) {
      gfp.internal_flags.noise_shaping = 2;
    }

    if (Math.abs(preset.nsbass) > 0) {
      let k = Math.trunc(preset.nsbass * 4);
      if (k < 0) {
        k += 64;
      }
      gfp.exp_nspsytune |= k << 2;
    }

    if (equals(gfp.quant_comp, -1)) {
      gfp.quant_comp = preset.quant_comp;
    }

    if (equals(gfp.quant_comp_short, -1)) {
      gfp.quant_comp_short = preset.quant_comp_s;
    }

    if (equals(gfp.msfix, -1)) {
      gfp.msfix = preset.nsmsfix;
    }

    if (equals(gfp.internal_flags.nsPsy.attackthre, -1)) {
      gfp.internal_flags.nsPsy.attackthre = preset.st_lrm;
    }

    if (equals(gfp.internal_flags.nsPsy.attackthre_s, -1)) {
      gfp.internal_flags.nsPsy.attackthre_s = preset.st_s;
    }

    if (equals(gfp.scale, -1)) {
      gfp.scale = preset.scale;
    }

    if (equals(gfp.maskingadjust, 0)) {
      gfp.maskingadjust = preset.masking_adj;
    }

    if (preset.masking_adj > 0) {
      if (equals(gfp.maskingadjust_short, 0)) {
        gfp.maskingadjust_short = preset.masking_adj * 0.9;
      }
    } else if (equals(gfp.maskingadjust_short, 0)) {
      gfp.maskingadjust_short = preset.masking_adj * 1.1;
    }

    if (equals(-gfp.ATHlower * 10, 0)) {
      gfp.ATHlower = -preset.ath_lower / 10;
    }

    if (equals(gfp.ATHcurve, -1)) {
      gfp.ATHcurve = preset.ath_curve;
    }

    if (equals(gfp.interChRatio, -1)) {
      gfp.interChRatio = preset.interch;
    }

    return bitrate;
  }

  private readonly optimumBandwidths = [
    { bitrate: 8, lowpass: 2000 },
    { bitrate: 16, lowpass: 3700 },
    { bitrate: 24, lowpass: 3900 },
    { bitrate: 32, lowpass: 5500 },
    { bitrate: 40, lowpass: 7000 },
    { bitrate: 48, lowpass: 7500 },
    { bitrate: 56, lowpass: 10000 },
    { bitrate: 64, lowpass: 11000 },
    { bitrate: 80, lowpass: 13500 },
    { bitrate: 96, lowpass: 15100 },
    { bitrate: 112, lowpass: 15600 },
    { bitrate: 128, lowpass: 17000 },
    { bitrate: 160, lowpass: 17500 },
    { bitrate: 192, lowpass: 18600 },
    { bitrate: 224, lowpass: 19400 },
    { bitrate: 256, lowpass: 19700 },
    { bitrate: 320, lowpass: 20500 },
  ] as const satisfies Record<FullBitrateIndex, BandPass>;

  public getOptimumBandwidth(bitrate: number) {
    const table_index = this.findNearestFullBitrateIndex(bitrate);
    return this.optimumBandwidths[table_index].lowpass;
  }
}
