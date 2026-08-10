import { LameInternalFlags } from './LameInternalFlags';
import { MPEGMode } from './MPEGMode';
import type { Quality } from './Quality';
import type { ShortBlock } from './ShortBlock';
import { VbrMode } from './VbrMode';
import type { SampleRate } from './sampleRates';

export class LameGlobalFlags {
  num_channels: number;

  in_samplerate: number;

  out_samplerate: SampleRate | 0 = 0;

  scale = -1;

  quality: Quality = 3;

  mode = MPEGMode.STEREO;

  brate: number;

  compression_ratio = 0;

  quant_comp = -1;

  quant_comp_short = -1;

  experimentalY = false;

  exp_nspsytune = 0;

  preset = 0;

  VBR = VbrMode.vbr_off;

  VBR_q: Quality = 4;

  VBR_mean_bitrate_kbps = 128;

  VBR_min_bitrate_kbps = 0;

  VBR_max_bitrate_kbps = 0;

  lowpassfreq = 0;

  maskingadjust = 0;

  maskingadjust_short = 0;

  ATHtype = -1;

  ATHcurve = -1;

  ATHlower = 0;

  athaa_loudapprox = -1;

  athaa_sensitivity = 0;

  short_blocks: ShortBlock | null = null;

  interChRatio = -1;

  msfix = -1;

  version: 0 | 1 = 0;

  framesize = 0;

  frameNum = 0;

  readonly internal_flags = new LameInternalFlags();

  constructor(channels: number, samplerate: number, kbps: number) {
    this.num_channels = channels;
    this.in_samplerate = samplerate;
    this.brate = kbps;
  }
}
