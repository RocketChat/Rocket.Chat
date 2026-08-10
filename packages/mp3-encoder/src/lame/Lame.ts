import { BitStream } from './BitStream';
import { CBRNewIterationLoop } from './CBRNewIterationLoop';
import { Encoder } from './Encoder';
import { GainAnalysis } from './GainAnalysis';
import { InOut } from './InOut';
import { LameGlobalFlags } from './LameGlobalFlags';
import { MPEGMode } from './MPEGMode';
import { NumUsed } from './NumUsed';
import { Presets } from './Presets';
import { PsyModel } from './PsyModel';
import { Quantize } from './Quantize';
import { ScaleFac } from './ScaleFac';
import { ShortBlock } from './ShortBlock';
import { VbrMode } from './VbrMode';
import { assert } from './assert';
import { findBitrateIndex, findNearestBitrate, getBitrate } from './bitrates';
import {
  BLKSIZE,
  BPC,
  ENCDELAY,
  FFTOFFSET,
  LAME_ID,
  MFSIZE,
  MPG_MD_MS_LR,
  POSTDELAY,
  PSFB12,
  PSFB21,
  SBMAX_l,
  SBMAX_s,
} from './constants';
import { isCloseToEachOther, blackmanWindow, gcd } from './math';
import type { SampleRate } from './sampleRates';
import { findNearestSampleRate } from './sampleRates';

export class Lame {
  private readonly bs: BitStream;

  private readonly p: Presets = new Presets();

  private readonly qu: Quantize;

  private readonly enc: Encoder;

  constructor() {
    this.bs = new BitStream();
    this.qu = new Quantize(this.bs);
    this.enc = new Encoder(this.bs, this.qu.qupvt.psy);
  }

  lame_init(channels: number, samplerate: number, kbps: number) {
    const gfp = new LameGlobalFlags(channels, samplerate, kbps);
    this.lame_init_params(gfp);
    return gfp;
  }

  // eslint-disable-next-line complexity
  private lame_init_params(gfp: LameGlobalFlags): void {
    const gfc = gfp.internal_flags;

    gfc.Class_ID = 0;

    gfc.channels_in = gfp.num_channels;
    if (gfc.channels_in === 1) {
      gfp.mode = MPEGMode.MONO;
    }
    gfc.channels_out = gfp.mode === MPEGMode.MONO ? 1 : 2;
    gfc.mode_ext = MPG_MD_MS_LR;

    if (
      gfp.VBR === VbrMode.vbr_off &&
      gfp.VBR_mean_bitrate_kbps !== 128 &&
      gfp.brate === 0
    ) {
      gfp.brate = gfp.VBR_mean_bitrate_kbps;
    }

    if (gfp.VBR === VbrMode.vbr_off && gfp.brate === 0) {
      if (isCloseToEachOther(gfp.compression_ratio, 0)) {
        gfp.compression_ratio = 11.025;
      }
    }

    if (gfp.VBR === VbrMode.vbr_off && gfp.compression_ratio > 0) {
      if (gfp.out_samplerate === 0) {
        gfp.out_samplerate = findNearestSampleRate(
          Math.trunc(0.97 * gfp.in_samplerate),
        );
      }

      gfp.brate = Math.trunc(
        (gfp.out_samplerate * 16 * gfc.channels_out) /
          (1e3 * gfp.compression_ratio),
      );

      Lame.smpFrqIndex(gfp);

      gfp.brate = findNearestBitrate(
        gfp.brate,
        gfp.version,
        gfp.out_samplerate,
      );
    }

    if (gfp.out_samplerate !== 0) {
      if (gfp.out_samplerate < 16000) {
        gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps, 8);
        gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps, 64);
      } else if (gfp.out_samplerate < 32000) {
        gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps, 8);
        gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps, 160);
      } else {
        gfp.VBR_mean_bitrate_kbps = Math.max(gfp.VBR_mean_bitrate_kbps, 32);
        gfp.VBR_mean_bitrate_kbps = Math.min(gfp.VBR_mean_bitrate_kbps, 320);
      }
    }

    if (gfp.lowpassfreq === 0) {
      let lowpass: number;

      switch (gfp.VBR) {
        case VbrMode.vbr_off: {
          lowpass = this.p.abrPresets.getOptimumBandwidth(gfp.brate);
          break;
        }
        case VbrMode.vbr_abr: {
          lowpass = this.p.abrPresets.getOptimumBandwidth(
            gfp.VBR_mean_bitrate_kbps,
          );
          break;
        }
        case VbrMode.vbr_rh: {
          const x = [
            19500, 19000, 18600, 18000, 17500, 16000, 15600, 14900, 12500,
            10000, 3950,
          ];
          if (gfp.VBR_q >= 0 && gfp.VBR_q <= 9) {
            lowpass = x[gfp.VBR_q];
          } else {
            lowpass = 19500;
          }
          break;
        }
        default: {
          const x = [
            19500, 19000, 18500, 18000, 17500, 16500, 15500, 14500, 12500, 9500,
            3950,
          ];
          if (gfp.VBR_q >= 0 && gfp.VBR_q <= 9) {
            lowpass = x[gfp.VBR_q];
          } else {
            lowpass = 19500;
          }
        }
      }
      if (
        gfp.mode === MPEGMode.MONO &&
        (gfp.VBR === VbrMode.vbr_off || gfp.VBR === VbrMode.vbr_abr)
      ) {
        lowpass *= 1.5;
      }

      gfp.lowpassfreq = Math.trunc(lowpass);
    }

    if (gfp.out_samplerate === 0) {
      if (2 * gfp.lowpassfreq > gfp.in_samplerate) {
        gfp.lowpassfreq = gfp.in_samplerate / 2;
      }
      gfp.out_samplerate = this.optimum_samplefreq(
        Math.trunc(gfp.lowpassfreq),
        gfp.in_samplerate,
      );
    }

    gfp.lowpassfreq = Math.min(20500, gfp.lowpassfreq);
    gfp.lowpassfreq = Math.min(gfp.out_samplerate / 2, gfp.lowpassfreq);

    if (gfp.VBR === VbrMode.vbr_off) {
      gfp.compression_ratio =
        (gfp.out_samplerate * 16 * gfc.channels_out) / (1e3 * gfp.brate);
    }
    if (gfp.VBR === VbrMode.vbr_abr) {
      gfp.compression_ratio =
        (gfp.out_samplerate * 16 * gfc.channels_out) /
        (1e3 * gfp.VBR_mean_bitrate_kbps);
    }

    gfc.findPeakSample = false;

    gfc.findReplayGain = false;

    if (gfc.findReplayGain) {
      if (
        this.bs.ga.initGainAnalysis(gfc.rgdata, gfp.out_samplerate) ===
        GainAnalysis.INIT_GAIN_ANALYSIS_ERROR
      ) {
        throw new Error('INIT_GAIN_ANALYSIS_ERROR');
      }
    }

    gfc.mode_gr = gfp.out_samplerate <= 24000 ? 1 : 2;

    gfp.framesize = 576 * gfc.mode_gr;

    gfc.resample_ratio = gfp.in_samplerate / gfp.out_samplerate;

    switch (gfp.VBR) {
      case VbrMode.vbr_mt:
      case VbrMode.vbr_rh:
      case VbrMode.vbr_mtrh:
        {
          const cmp = [5.7, 6.5, 7.3, 8.2, 10, 11.9, 13, 14, 15, 16.5];
          gfp.compression_ratio = cmp[gfp.VBR_q];
        }
        break;
      case VbrMode.vbr_abr:
        gfp.compression_ratio =
          (gfp.out_samplerate * 16 * gfc.channels_out) /
          (1e3 * gfp.VBR_mean_bitrate_kbps);
        break;
      default:
        gfp.compression_ratio =
          (gfp.out_samplerate * 16 * gfc.channels_out) / (1e3 * gfp.brate);
        break;
    }

    if (gfp.mode === MPEGMode.NOT_SET) {
      gfp.mode = MPEGMode.JOINT_STEREO;
    }

    gfc.highpass1 = 0;
    gfc.highpass2 = 0;

    if (gfp.lowpassfreq > 0) {
      gfc.lowpass2 = 2 * gfp.lowpassfreq;

      gfc.lowpass1 = (1 - 0.0) * 2 * gfp.lowpassfreq;

      gfc.lowpass1 /= gfp.out_samplerate;
      gfc.lowpass2 /= gfp.out_samplerate;
    } else {
      gfc.lowpass1 = 0;
      gfc.lowpass2 = 0;
    }

    this.lame_init_params_ppflt(gfp);

    Lame.smpFrqIndex(gfp);
    if (gfc.samplerate_index < 0) {
      throw new Error('Invalid sample rate');
    }

    if (gfp.VBR === VbrMode.vbr_off) {
      gfp.brate = findNearestBitrate(
        gfp.brate,
        gfp.version,
        gfp.out_samplerate,
      );
      gfc.bitrate_index = findBitrateIndex(
        gfp.brate,
        gfp.version,
        gfp.out_samplerate,
      );
    } else {
      gfc.bitrate_index = 1;
    }

    this.bs.resetPointers(gfc);

    const j =
      gfc.samplerate_index +
      3 * gfp.version +
      6 * (gfp.out_samplerate < 16000 ? 1 : 0);
    for (let i = 0; i < SBMAX_l + 1; i++)
      gfc.scalefac_band.l[i] = this.sfBandIndex[j].l[i];

    for (let i = 0; i < PSFB21 + 1; i++) {
      const size = (gfc.scalefac_band.l[22] - gfc.scalefac_band.l[21]) / PSFB21;
      const start = gfc.scalefac_band.l[21] + i * size;
      gfc.scalefac_band.psfb21[i] = start;
    }
    gfc.scalefac_band.psfb21[PSFB21] = 576;

    for (let i = 0; i < SBMAX_s + 1; i++) {
      gfc.scalefac_band.s[i] = this.sfBandIndex[j].s[i];
    }

    for (let i = 0; i < PSFB12 + 1; i++) {
      const size = (gfc.scalefac_band.s[13] - gfc.scalefac_band.s[12]) / PSFB12;
      const start = gfc.scalefac_band.s[12] + i * size;
      gfc.scalefac_band.psfb12[i] = start;
    }
    gfc.scalefac_band.psfb12[PSFB12] = 192;

    if (gfp.version === 1) {
      gfc.sideinfo_len = gfc.channels_out === 1 ? 4 + 17 : 4 + 32;
    } else {
      gfc.sideinfo_len = gfc.channels_out === 1 ? 4 + 9 : 4 + 17;
    }

    this.lame_init_bitstream(gfp);

    gfc.Class_ID = LAME_ID;

    let k;

    for (k = 0; k < 19; k++) {
      gfc.nsPsy.pefirbuf[k] = 700 * gfc.mode_gr * gfc.channels_out;
    }

    if (gfp.ATHtype === -1) {
      gfp.ATHtype = 4;
    }

    assert(gfp.VBR_q <= 9);
    assert(gfp.VBR_q >= 0);

    switch (gfp.VBR) {
      case VbrMode.vbr_mt:
        gfp.VBR = VbrMode.vbr_mtrh;

      // eslint-disable-next-line no-fallthrough
      case VbrMode.vbr_mtrh: {
        this.p.applyPresetFromQuality(gfp, gfp.VBR_q);

        if (gfp.quality < 0) gfp.quality = Lame.LAME_DEFAULT_QUALITY;
        if (gfp.quality < 5) gfp.quality = 0;
        if (gfp.quality > 5) gfp.quality = 5;

        gfc.PSY.mask_adjust = gfp.maskingadjust;
        gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

        if (gfp.experimentalY) gfc.sfb21_extra = false;
        else gfc.sfb21_extra = gfp.out_samplerate > 44000;

        gfc.iteration_loop = new CBRNewIterationLoop(this.qu);
        break;
      }
      case VbrMode.vbr_rh: {
        this.p.applyPresetFromQuality(gfp, gfp.VBR_q);

        gfc.PSY.mask_adjust = gfp.maskingadjust;
        gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

        if (gfp.experimentalY) {
          gfc.sfb21_extra = false;
        } else gfc.sfb21_extra = gfp.out_samplerate > 44000;

        if (gfp.quality > 6) {
          gfp.quality = 6;
        }

        if (gfp.quality < 0) {
          gfp.quality = Lame.LAME_DEFAULT_QUALITY;
        }

        gfc.iteration_loop = new CBRNewIterationLoop(this.qu);
        break;
      }

      default: {
        gfc.sfb21_extra = false;

        if (gfp.quality < 0) {
          gfp.quality = Lame.LAME_DEFAULT_QUALITY;
        }

        const vbrmode = gfp.VBR;
        if (vbrmode === VbrMode.vbr_off) {
          gfp.VBR_mean_bitrate_kbps = gfp.brate;
        }

        this.p.apply(gfp, gfp.VBR_mean_bitrate_kbps);
        gfp.VBR = vbrmode;

        gfc.PSY.mask_adjust = gfp.maskingadjust;
        gfc.PSY.mask_adjust_short = gfp.maskingadjust_short;

        if (vbrmode === VbrMode.vbr_off) {
          gfc.iteration_loop = new CBRNewIterationLoop(this.qu);
        } else {
          gfc.iteration_loop = new CBRNewIterationLoop(this.qu);
        }
        break;
      }
    }
    assert(gfp.scale >= 0);

    if (gfp.VBR !== VbrMode.vbr_off) {
      gfc.VBR_min_bitrate = 1;

      gfc.VBR_max_bitrate = 14;

      if (gfp.out_samplerate < 16000) {
        gfc.VBR_max_bitrate = 8;
      }

      if (gfp.VBR_min_bitrate_kbps !== 0) {
        gfp.VBR_min_bitrate_kbps = findNearestBitrate(
          gfp.VBR_min_bitrate_kbps,
          gfp.version,
          gfp.out_samplerate,
        );
        gfc.VBR_min_bitrate = findBitrateIndex(
          gfp.VBR_min_bitrate_kbps,
          gfp.version,
          gfp.out_samplerate,
        );
      }
      if (gfp.VBR_max_bitrate_kbps !== 0) {
        gfp.VBR_max_bitrate_kbps = findNearestBitrate(
          gfp.VBR_max_bitrate_kbps,
          gfp.version,
          gfp.out_samplerate,
        );
        gfc.VBR_max_bitrate = findBitrateIndex(
          gfp.VBR_max_bitrate_kbps,
          gfp.version,
          gfp.out_samplerate,
        );
      }
      gfp.VBR_min_bitrate_kbps = getBitrate(gfp.version, gfc.VBR_min_bitrate);
      gfp.VBR_max_bitrate_kbps = getBitrate(gfp.version, gfc.VBR_max_bitrate);
      gfp.VBR_mean_bitrate_kbps = Math.min(
        getBitrate(gfp.version, gfc.VBR_max_bitrate),
        gfp.VBR_mean_bitrate_kbps,
      );
      gfp.VBR_mean_bitrate_kbps = Math.max(
        getBitrate(gfp.version, gfc.VBR_min_bitrate),
        gfp.VBR_mean_bitrate_kbps,
      );
    }

    this.lame_init_qval(gfp);
    assert(gfp.scale >= 0);

    gfc.ATH.useAdjust = 3;

    gfc.ATH.aaSensitivityP = Math.pow(10.0, gfp.athaa_sensitivity / -10.0);

    if (gfp.short_blocks === null) {
      gfp.short_blocks = ShortBlock.short_block_allowed;
    }

    if (
      gfp.short_blocks === ShortBlock.short_block_allowed &&
      (gfp.mode === MPEGMode.JOINT_STEREO || gfp.mode === MPEGMode.STEREO)
    ) {
      gfp.short_blocks = ShortBlock.short_block_coupled;
    }

    if (gfp.quant_comp < 0) {
      gfp.quant_comp = 1;
    }
    if (gfp.quant_comp_short < 0) {
      gfp.quant_comp_short = 0;
    }

    if (gfp.msfix < 0) {
      gfp.msfix = 0;
    }

    gfp.exp_nspsytune |= 1;

    if (gfp.internal_flags.nsPsy.attackthre < 0) {
      gfp.internal_flags.nsPsy.attackthre = PsyModel.NSATTACKTHRE;
    }
    if (gfp.internal_flags.nsPsy.attackthre_s < 0) {
      gfp.internal_flags.nsPsy.attackthre_s = PsyModel.NSATTACKTHRE_S;
    }

    assert(gfp.scale >= 0);

    if (gfp.scale < 0) {
      gfp.scale = 1;
    }

    if (gfp.ATHtype < 0) {
      gfp.ATHtype = 4;
    }

    if (gfp.ATHcurve < 0) {
      gfp.ATHcurve = 4;
    }

    if (gfp.athaa_loudapprox < 0) {
      gfp.athaa_loudapprox = 2;
    }

    if (gfp.interChRatio < 0) {
      gfp.interChRatio = 0;
    }

    gfc.slot_lag = 0;
    gfc.frac_SpF = 0;
    if (gfp.VBR === VbrMode.vbr_off) {
      gfc.frac_SpF =
        ((gfp.version + 1) * 72000 * gfp.brate) %
        Math.trunc(gfp.out_samplerate);
      gfc.slot_lag = gfc.frac_SpF;
    }

    this.qu.qupvt.iteration_init(gfp, this.qu.tak);
    this.qu.qupvt.psy.psymodel_init(gfp);
    assert(gfp.scale >= 0);
  }

  private filterCoeficient(x: number) {
    if (x > 1.0) {
      return 0.0;
    }
    if (x <= 0.0) {
      return 1.0;
    }

    return Math.cos((Math.PI / 2) * x);
  }

  private optimum_samplefreq(
    lowpassfreq: number,
    input_samplefreq: number,
  ): SampleRate {
    let suggested_samplefreq: SampleRate = 44100;

    if (input_samplefreq >= 48000) suggested_samplefreq = 48000;
    else if (input_samplefreq >= 44100) suggested_samplefreq = 44100;
    else if (input_samplefreq >= 32000) suggested_samplefreq = 32000;
    else if (input_samplefreq >= 24000) suggested_samplefreq = 24000;
    else if (input_samplefreq >= 22050) suggested_samplefreq = 22050;
    else if (input_samplefreq >= 16000) suggested_samplefreq = 16000;
    else if (input_samplefreq >= 12000) suggested_samplefreq = 12000;
    else if (input_samplefreq >= 11025) suggested_samplefreq = 11025;
    else if (input_samplefreq >= 8000) suggested_samplefreq = 8000;

    if (lowpassfreq === -1) return suggested_samplefreq;

    if (lowpassfreq <= 15960) suggested_samplefreq = 44100;
    if (lowpassfreq <= 15250) suggested_samplefreq = 32000;
    if (lowpassfreq <= 11220) suggested_samplefreq = 24000;
    if (lowpassfreq <= 9970) suggested_samplefreq = 22050;
    if (lowpassfreq <= 7230) suggested_samplefreq = 16000;
    if (lowpassfreq <= 5420) suggested_samplefreq = 12000;
    if (lowpassfreq <= 4510) suggested_samplefreq = 11025;
    if (lowpassfreq <= 3970) suggested_samplefreq = 8000;

    if (input_samplefreq < suggested_samplefreq) {
      if (input_samplefreq > 44100) return 48000;
      if (input_samplefreq > 32000) return 44100;
      if (input_samplefreq > 24000) return 32000;
      if (input_samplefreq > 22050) return 24000;
      if (input_samplefreq > 16000) return 22050;
      if (input_samplefreq > 12000) return 16000;
      if (input_samplefreq > 11025) return 12000;
      if (input_samplefreq > 8000) return 11025;
      return 8000;
    }

    return suggested_samplefreq;
  }

  private static smpFrqIndex(gpf: LameGlobalFlags): void {
    switch (gpf.out_samplerate) {
      case 44100:
        gpf.version = 1;
        gpf.internal_flags.samplerate_index = 0;
        return;
      case 48000:
        gpf.version = 1;
        gpf.internal_flags.samplerate_index = 1;
        return;
      case 32000:
        gpf.version = 1;
        gpf.internal_flags.samplerate_index = 2;
        return;
      case 22050:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 0;
        return;
      case 24000:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 1;
        return;
      case 16000:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 2;
        return;
      case 11025:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 0;
        return;
      case 12000:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 1;
        return;
      case 8000:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = 2;
        return;
      default:
        gpf.version = 0;
        gpf.internal_flags.samplerate_index = -1;
    }
  }

  private lame_init_params_ppflt(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;

    let lowpass_band = 32;
    let highpass_band = -1;

    if (gfc.lowpass1 > 0) {
      let minband = 999;
      for (let band = 0; band <= 31; band++) {
        const freq = band / 31.0;

        if (freq >= gfc.lowpass2) {
          lowpass_band = Math.min(lowpass_band, band);
        }
        if (gfc.lowpass1 < freq && freq < gfc.lowpass2) {
          minband = Math.min(minband, band);
        }
      }

      if (minband === 999) {
        gfc.lowpass1 = (lowpass_band - 0.75) / 31.0;
      } else {
        gfc.lowpass1 = (minband - 0.75) / 31.0;
      }
      gfc.lowpass2 = lowpass_band / 31.0;
    }

    if (gfc.highpass2 > 0) {
      if (gfc.highpass2 < 0.9 * (0.75 / 31.0)) {
        gfc.highpass1 = 0;
        gfc.highpass2 = 0;
        console.warn(
          'Warning: highpass filter disabled. highpass frequency too small',
        );
      }
    }

    if (gfc.highpass2 > 0) {
      let maxband = -1;
      for (let band = 0; band <= 31; band++) {
        const freq = band / 31.0;

        if (freq <= gfc.highpass1) {
          highpass_band = Math.max(highpass_band, band);
        }
        if (gfc.highpass1 < freq && freq < gfc.highpass2) {
          maxband = Math.max(maxband, band);
        }
      }

      gfc.highpass1 = highpass_band / 31.0;
      if (maxband === -1) {
        gfc.highpass2 = (highpass_band + 0.75) / 31.0;
      } else {
        gfc.highpass2 = (maxband + 0.75) / 31.0;
      }
    }

    for (let band = 0; band < 32; band++) {
      let fc1;
      let fc2;
      const freq = band / 31.0;
      if (gfc.highpass2 > gfc.highpass1) {
        fc1 = this.filterCoeficient(
          (gfc.highpass2 - freq) / (gfc.highpass2 - gfc.highpass1 + 1e-20),
        );
      } else {
        fc1 = 1.0;
      }
      if (gfc.lowpass2 > gfc.lowpass1) {
        fc2 = this.filterCoeficient(
          (freq - gfc.lowpass1) / (gfc.lowpass2 - gfc.lowpass1 + 1e-20),
        );
      } else {
        fc2 = 1.0;
      }
      gfc.amp_filter[band] = fc1 * fc2;
    }
  }

  private lame_init_qval(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;

    switch (gfp.quality) {
      default:
      case 9:
        gfc.psymodel = 0;
        gfc.noise_shaping = 0;
        gfc.noise_shaping_amp = 0;
        gfc.noise_shaping_stop = 0;
        gfc.use_best_huffman = 0;
        gfc.full_outer_loop = 0;
        break;

      case 8:
        gfp.quality = 7;

      // eslint-disable-next-line no-fallthrough
      case 7:
        gfc.psymodel = 1;
        gfc.noise_shaping = 0;
        gfc.noise_shaping_amp = 0;
        gfc.noise_shaping_stop = 0;
        gfc.use_best_huffman = 0;
        gfc.full_outer_loop = 0;
        break;

      case 6:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        gfc.noise_shaping_amp = 0;
        gfc.noise_shaping_stop = 0;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 0;
        gfc.full_outer_loop = 0;
        break;

      case 5:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        gfc.noise_shaping_amp = 0;
        gfc.noise_shaping_stop = 0;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 0;
        gfc.full_outer_loop = 0;
        break;

      case 4:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        gfc.noise_shaping_amp = 0;
        gfc.noise_shaping_stop = 0;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 1;
        gfc.full_outer_loop = 0;
        break;

      case 3:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        gfc.noise_shaping_amp = 1;
        gfc.noise_shaping_stop = 1;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 1;
        gfc.full_outer_loop = 0;
        break;

      case 2:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        if (gfc.substep_shaping === 0) gfc.substep_shaping = 2;
        gfc.noise_shaping_amp = 1;
        gfc.noise_shaping_stop = 1;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 1;

        gfc.full_outer_loop = 0;
        break;

      case 1:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        if (gfc.substep_shaping === 0) gfc.substep_shaping = 2;
        gfc.noise_shaping_amp = 2;
        gfc.noise_shaping_stop = 1;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 1;
        gfc.full_outer_loop = 0;
        break;

      case 0:
        gfc.psymodel = 1;
        if (gfc.noise_shaping === 0) gfc.noise_shaping = 1;
        if (gfc.substep_shaping === 0) gfc.substep_shaping = 2;
        gfc.noise_shaping_amp = 2;
        gfc.noise_shaping_stop = 1;
        if (gfc.subblock_gain === -1) gfc.subblock_gain = 1;
        gfc.use_best_huffman = 1;

        gfc.full_outer_loop = 0;

        break;
    }
  }

  private lame_init_bitstream(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;
    gfp.frameNum = 0;
    gfc.PeakSample = 0.0;
  }

  private static readonly LAME_DEFAULT_QUALITY = 3;

  lame_encode_flush(
    gfp: LameGlobalFlags,
    mp3buffer: Uint8Array,
    mp3bufferPos: number,
    mp3buffer_size: number,
  ) {
    const gfc = gfp.internal_flags;

    if (gfc.mf_samples_to_encode < 1) {
      return 0;
    }

    let samples_to_encode = gfc.mf_samples_to_encode - POSTDELAY;
    if (gfp.in_samplerate !== gfp.out_samplerate) {
      samples_to_encode += (16 * gfp.out_samplerate) / gfp.in_samplerate;
    }
    let end_padding = gfp.framesize - (samples_to_encode % gfp.framesize);
    if (end_padding < 576) end_padding += gfp.framesize;

    let frames_left = (samples_to_encode + end_padding) / gfp.framesize;

    const buffer = Array.from({ length: 2 }, () => new Int16Array(1152));
    const mf_needed = Lame.calcNeeded(gfp);
    let mp3count = 0;
    let imp3 = 0;
    let mp3buffer_size_remaining;

    while (frames_left > 0 && imp3 >= 0) {
      let bunch = mf_needed - gfc.mf_size;
      const frame_num = gfp.frameNum;

      bunch *= gfp.in_samplerate;
      bunch /= gfp.out_samplerate;
      if (bunch > 1152) bunch = 1152;
      if (bunch < 1) bunch = 1;

      mp3buffer_size_remaining = mp3buffer_size - mp3count;

      if (mp3buffer_size === 0) mp3buffer_size_remaining = 0;

      imp3 = this.lame_encode_buffer(
        gfp,
        buffer[0],
        buffer[1],
        bunch,
        mp3buffer,
        mp3bufferPos,
        mp3buffer_size_remaining,
      );

      mp3bufferPos += imp3;
      mp3count += imp3;
      frames_left -= frame_num !== gfp.frameNum ? 1 : 0;
    }

    gfc.mf_samples_to_encode = 0;

    if (imp3 < 0) {
      return imp3;
    }

    mp3buffer_size_remaining = mp3buffer_size - mp3count;

    if (mp3buffer_size === 0) mp3buffer_size_remaining = 0;

    this.bs.flush_bitstream(gfp);
    imp3 = this.bs.copyFrameData(
      gfc,
      mp3buffer,
      mp3bufferPos,
      mp3buffer_size_remaining,
    );
    if (imp3 < 0) {
      return imp3;
    }
    mp3bufferPos += imp3;
    mp3count += imp3;

    return mp3count;
  }

  lame_encode_buffer(
    gfp: LameGlobalFlags,
    buffer_l: Int16Array,
    buffer_r: Int16Array,
    nsamples: number,
    mp3buf: Uint8Array,
    mp3bufPos: number,
    mp3buf_size: number,
  ) {
    const gfc = gfp.internal_flags;

    if (gfc.Class_ID !== LAME_ID) return -3;

    if (nsamples === 0) return 0;

    if (
      gfc.in_buffer_0 === null ||
      gfc.in_buffer_1 === null ||
      gfc.in_buffer_nsamples < nsamples
    ) {
      gfc.in_buffer_0 = new Float32Array(nsamples);
      gfc.in_buffer_1 = new Float32Array(nsamples);
      gfc.in_buffer_nsamples = nsamples;
    }

    const in_buffer = [gfc.in_buffer_0, gfc.in_buffer_1] as const;

    for (let i = 0; i < nsamples; i++) {
      in_buffer[0][i] = buffer_l[i];
      if (gfc.channels_in > 1) {
        in_buffer[1][i] = buffer_r[i];
      }
    }

    return this.lame_encode_buffer_sample(
      gfp,
      in_buffer[0],
      in_buffer[1],
      nsamples,
      mp3buf,
      mp3bufPos,
      mp3buf_size,
    );
  }

  private static calcNeeded(gfp: LameGlobalFlags) {
    let mf_needed = BLKSIZE + gfp.framesize - FFTOFFSET;

    mf_needed = Math.max(mf_needed, 512 + gfp.framesize - 32);
    assert(MFSIZE >= mf_needed);

    return mf_needed;
  }

  private lame_encode_buffer_sample(
    gfp: LameGlobalFlags,
    buffer_l: Float32Array,
    buffer_r: Float32Array,
    nsamples: number,
    mp3buf: Uint8Array,
    mp3bufPos: number,
    mp3buf_size: number,
  ) {
    const gfc = gfp.internal_flags;

    if (gfc.Class_ID !== LAME_ID) return -3;

    if (nsamples === 0) return 0;

    const mp3out = this.bs.copyMetadata(gfc, mp3buf, mp3bufPos, mp3buf_size);
    if (mp3out < 0) return mp3out;

    mp3bufPos += mp3out;
    let mp3size = mp3out;

    const in_buffer = [buffer_l, buffer_r] as const;

    if (
      !isCloseToEachOther(gfp.scale, 0) &&
      !isCloseToEachOther(gfp.scale, 1.0)
    ) {
      for (let i = 0; i < nsamples; ++i) {
        in_buffer[0][i] *= gfp.scale;
        if (gfc.channels_out === 2) in_buffer[1][i] *= gfp.scale;
      }
    }

    if (gfp.num_channels === 2 && gfc.channels_out === 1) {
      for (let i = 0; i < nsamples; ++i) {
        in_buffer[0][i] = 0.5 * (in_buffer[0][i] + in_buffer[1][i]);
        in_buffer[1][i] = 0.0;
      }
    }

    const mf_needed = Lame.calcNeeded(gfp);

    const mfbuf: [Float32Array, Float32Array] = [gfc.mfbuf[0], gfc.mfbuf[1]];

    let in_bufferPos = 0;
    while (nsamples > 0) {
      const in_buffer_ptr: [Float32Array, Float32Array] = [
        in_buffer[0],
        in_buffer[1],
      ];

      const inOut = new InOut();
      Lame.fill_buffer(
        gfp,
        mfbuf,
        in_buffer_ptr,
        in_bufferPos,
        nsamples,
        inOut,
      );
      const { n_in } = inOut;
      const { n_out } = inOut;

      if (gfc.findReplayGain)
        if (
          this.bs.ga.analyzeSamples(
            gfc.rgdata,
            mfbuf[0],
            gfc.mf_size,
            mfbuf[1],
            gfc.mf_size,
            n_out,
            gfc.channels_out,
          ) === GainAnalysis.GAIN_ANALYSIS_ERROR
        ) {
          return -6;
        }

      nsamples -= n_in;
      in_bufferPos += n_in;

      gfc.mf_size += n_out;
      assert(gfc.mf_size <= MFSIZE);

      if (gfc.mf_samples_to_encode < 1) {
        gfc.mf_samples_to_encode = ENCDELAY + POSTDELAY;
      }
      gfc.mf_samples_to_encode += n_out;

      if (gfc.mf_size >= mf_needed) {
        let buf_size = mp3buf_size - mp3size;
        if (mp3buf_size === 0) buf_size = 0;

        const ret = this.lame_encode_frame(
          gfp,
          mfbuf[0],
          mfbuf[1],
          mp3buf,
          mp3bufPos,
          buf_size,
        );

        if (ret < 0) return ret;
        mp3bufPos += ret;
        mp3size += ret;

        gfc.mf_size -= gfp.framesize;
        gfc.mf_samples_to_encode -= gfp.framesize;
        for (let ch = 0; ch < gfc.channels_out; ch++) {
          for (let i = 0; i < gfc.mf_size; i++) {
            mfbuf[ch][i] = mfbuf[ch][i + gfp.framesize];
          }
        }
      }
    }
    assert(nsamples === 0);

    return mp3size;
  }

  private lame_encode_frame(
    gfp: LameGlobalFlags,
    inbuf_l: Float32Array,
    inbuf_r: Float32Array,
    mp3buf: Uint8Array,
    mp3bufPos: number,
    mp3buf_size: number,
  ) {
    const ret = this.enc.lame_encode_mp3_frame(
      gfp,
      inbuf_l,
      inbuf_r,
      mp3buf,
      mp3bufPos,
      mp3buf_size,
    );
    gfp.frameNum++;
    return ret;
  }

  private static fill_buffer_resample(
    gfp: LameGlobalFlags,
    outbuf: Float32Array,
    outbufPos: number,
    desired_len: number,
    inbuf: Float32Array,
    in_bufferPos: number,
    len: number,
    num_used: NumUsed,
    ch: number,
  ) {
    const gfc = gfp.internal_flags;
    let i;
    let j = 0;
    let k;

    let bpc = gfp.out_samplerate / gcd(gfp.out_samplerate, gfp.in_samplerate);
    if (bpc > BPC) bpc = BPC;

    const intratio =
      Math.abs(gfc.resample_ratio - Math.floor(0.5 + gfc.resample_ratio)) <
      0.0001
        ? 1
        : 0;
    let fcn = 1.0 / gfc.resample_ratio;
    if (fcn > 1.0) fcn = 1.0;
    let filter_l = 31;
    if (filter_l % 2 === 0) --filter_l;

    filter_l += intratio;

    const BLACKSIZE = filter_l + 1;

    if (!gfc.fill_buffer_resample_init) {
      gfc.inbuf_old[0] = new Float32Array(BLACKSIZE);
      gfc.inbuf_old[1] = new Float32Array(BLACKSIZE);
      for (i = 0; i <= 2 * bpc; ++i)
        gfc.blackfilt[i] = new Float32Array(BLACKSIZE);

      gfc.itime[0] = 0;
      gfc.itime[1] = 0;

      for (j = 0; j <= 2 * bpc; j++) {
        let sum = 0;
        const offset = (j - bpc) / (2 * bpc);
        for (i = 0; i <= filter_l; i++) {
          gfc.blackfilt[j][i] = blackmanWindow(i - offset, fcn, filter_l);
          sum += gfc.blackfilt[j][i];
        }
        for (i = 0; i <= filter_l; i++) gfc.blackfilt[j][i] /= sum;
      }
      gfc.fill_buffer_resample_init = true;
    }

    const inbuf_old = gfc.inbuf_old[ch];

    for (k = 0; k < desired_len; k++) {
      const time0 = k * gfc.resample_ratio;

      j = Math.floor(time0 - gfc.itime[ch]);

      if (filter_l + j - filter_l / 2 >= len) break;

      const offset = time0 - gfc.itime[ch] - (j + 0.5 * (filter_l % 2));
      assert(Math.abs(offset) <= 0.501);

      const joff = Math.floor(offset * 2 * bpc + bpc + 0.5);
      let xvalue = 0;
      for (i = 0; i <= filter_l; ++i) {
        const j2 = Math.trunc(i + j - filter_l / 2);
        assert(j2 < len);
        assert(j2 + BLACKSIZE >= 0);
        const y = j2 < 0 ? inbuf_old[BLACKSIZE + j2] : inbuf[in_bufferPos + j2];
        xvalue += y * gfc.blackfilt[joff][i];
      }
      outbuf[outbufPos + k] = xvalue;
    }

    num_used.num_used = Math.min(len, filter_l + j - filter_l / 2);

    gfc.itime[ch] += num_used.num_used - k * gfc.resample_ratio;

    if (num_used.num_used >= BLACKSIZE) {
      for (i = 0; i < BLACKSIZE; i++) {
        inbuf_old[i] = inbuf[in_bufferPos + num_used.num_used + i - BLACKSIZE];
      }
    } else {
      const n_shift = BLACKSIZE - num_used.num_used;

      for (i = 0; i < n_shift; ++i) {
        inbuf_old[i] = inbuf_old[i + num_used.num_used];
      }

      for (j = 0; i < BLACKSIZE; ++i, ++j) {
        inbuf_old[i] = inbuf[in_bufferPos + j];
      }

      assert(j === num_used.num_used);
    }
    return k;
  }

  private static fill_buffer(
    gfp: LameGlobalFlags,
    mfbuf: [Float32Array, Float32Array],
    in_buffer: Float32Array[],
    in_bufferPos: number,
    nsamples: number,
    io: InOut,
  ) {
    const gfc = gfp.internal_flags;

    if (gfc.resample_ratio < 0.9999 || gfc.resample_ratio > 1.0001) {
      for (let ch = 0; ch < gfc.channels_out; ch++) {
        const numUsed = new NumUsed();
        io.n_out = Lame.fill_buffer_resample(
          gfp,
          mfbuf[ch],
          gfc.mf_size,
          gfp.framesize,
          in_buffer[ch],
          in_bufferPos,
          nsamples,
          numUsed,
          ch,
        );
        io.n_in = numUsed.num_used;
      }
    } else {
      io.n_out = Math.min(gfp.framesize, nsamples);
      io.n_in = io.n_out;
      for (let i = 0; i < io.n_out; ++i) {
        mfbuf[0][gfc.mf_size + i] = in_buffer[0][in_bufferPos + i];
        if (gfc.channels_out === 2)
          mfbuf[1][gfc.mf_size + i] = in_buffer[1][in_bufferPos + i];
      }
    }
  }

  private readonly sfBandIndex = [
    new ScaleFac(
      [
        0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238,
        284, 336, 396, 464, 522, 576,
      ],
      [0, 4, 8, 12, 18, 24, 32, 42, 56, 74, 100, 132, 174, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),

    new ScaleFac(
      [
        0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 114, 136, 162, 194, 232,
        278, 332, 394, 464, 540, 576,
      ],
      [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 136, 180, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238,
        284, 336, 396, 464, 522, 576,
      ],
      [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 134, 174, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 74, 90, 110, 134, 162, 196,
        238, 288, 342, 418, 576,
      ],
      [0, 4, 8, 12, 16, 22, 30, 40, 52, 66, 84, 106, 136, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 4, 8, 12, 16, 20, 24, 30, 36, 42, 50, 60, 72, 88, 106, 128, 156, 190,
        230, 276, 330, 384, 576,
      ],
      [0, 4, 8, 12, 16, 22, 28, 38, 50, 64, 80, 100, 126, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 54, 66, 82, 102, 126, 156, 194,
        240, 296, 364, 448, 550, 576,
      ],
      [0, 4, 8, 12, 16, 22, 30, 42, 58, 78, 104, 138, 180, 192],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238,
        284, 336, 396, 464, 522, 576,
      ],
      [
        0 / 3,
        12 / 3,
        24 / 3,
        36 / 3,
        54 / 3,
        78 / 3,
        108 / 3,
        144 / 3,
        186 / 3,
        240 / 3,
        312 / 3,
        402 / 3,
        522 / 3,
        576 / 3,
      ],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
    new ScaleFac(
      [
        0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238,
        284, 336, 396, 464, 522, 576,
      ],
      [
        0 / 3,
        12 / 3,
        24 / 3,
        36 / 3,
        54 / 3,
        78 / 3,
        108 / 3,
        144 / 3,
        186 / 3,
        240 / 3,
        312 / 3,
        402 / 3,
        522 / 3,
        576 / 3,
      ],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),

    new ScaleFac(
      [
        0, 12, 24, 36, 48, 60, 72, 88, 108, 132, 160, 192, 232, 280, 336, 400,
        476, 566, 568, 570, 572, 574, 576,
      ],
      [
        0 / 3,
        24 / 3,
        48 / 3,
        72 / 3,
        108 / 3,
        156 / 3,
        216 / 3,
        288 / 3,
        372 / 3,
        480 / 3,
        486 / 3,
        492 / 3,
        498 / 3,
        576 / 3,
      ],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ),
  ] as const;
}
