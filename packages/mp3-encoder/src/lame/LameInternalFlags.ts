import { ATH } from './ATH';
import type { CBRNewIterationLoop } from './CBRNewIterationLoop';
import { Header } from './Header';
import { IIISideInfo } from './IIISideInfo';
import { III_psy_xmin } from './III_psy_xmin';
import { NsPsy } from './NsPsy';
import { PSY } from './PSY';
import { ReplayGain } from './ReplayGain';
import { ScaleFac } from './ScaleFac';
import {
  BPC,
  CBANDS,
  ENCDELAY,
  MAX_HEADER_BUF,
  MDCTDELAY,
  MFSIZE,
  POSTDELAY,
  SBLIMIT,
  SBMAX_l,
  SBMAX_s,
  SFBMAX,
} from './constants';

export class LameInternalFlags {
  Class_ID = 0;

  lame_encode_frame_init = false;

  iteration_init_init = false;

  fill_buffer_resample_init = false;

  readonly mfbuf = Array.from({ length: 2 }, () => new Float32Array(MFSIZE));

  mode_gr = 0;

  channels_in = 0;

  channels_out = 0;

  resample_ratio = 1;

  mf_samples_to_encode = ENCDELAY + POSTDELAY;

  mf_size = ENCDELAY - MDCTDELAY;

  VBR_min_bitrate = 1;

  VBR_max_bitrate = 13;

  bitrate_index = 0;

  samplerate_index = 0;

  mode_ext = 0;

  lowpass1 = 0;

  lowpass2 = 0;

  highpass1 = 0;

  highpass2 = 0;

  noise_shaping = 0;

  noise_shaping_amp = 0;

  substep_shaping = 0;

  psymodel = 0;

  noise_shaping_stop = 0;

  subblock_gain = -1;

  use_best_huffman = 0;

  full_outer_loop = 0;

  readonly l3_side = new IIISideInfo();

  padding = 0;

  frac_SpF = 0;

  slot_lag = 0;

  nMusicCRC = 0;

  oldValue = new Int32Array([180, 180]);

  currentStep = new Int32Array([4, 4]);

  masking_lower = 1;

  readonly bv_scf = new Int32Array(576);

  readonly pseudohalf = new Int32Array(SFBMAX);

  sfb21_extra = false;

  readonly inbuf_old = Array.from({ length: 2 }, () => new Float32Array());

  readonly blackfilt = Array.from(
    { length: 2 * BPC + 1 },
    () => new Float32Array(),
  );

  readonly itime = new Float64Array(2);

  sideinfo_len = 0;

  readonly sb_sample = Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () =>
      Array.from({ length: 18 }, () => new Float32Array(SBLIMIT)),
    ),
  );

  readonly amp_filter = new Float32Array(32);

  readonly header = Array.from({ length: MAX_HEADER_BUF }, () => new Header());

  h_ptr = 0;

  w_ptr = 0;

  ResvSize = 0;

  readonly scalefac_band = new ScaleFac();

  readonly minval_l = new Float32Array(CBANDS);

  readonly minval_s = new Float32Array(CBANDS);

  readonly nb_1 = Array.from({ length: 4 }, () => new Float32Array(CBANDS));

  readonly nb_2 = Array.from({ length: 4 }, () => new Float32Array(CBANDS));

  readonly nb_s1 = Array.from({ length: 4 }, () => new Float32Array(CBANDS));

  readonly nb_s2 = Array.from({ length: 4 }, () => new Float32Array(CBANDS));

  s3_ss: Float32Array | null = null;

  s3_ll: Float32Array | null = null;

  decay = 0;

  readonly thm = Array.from({ length: 4 }, () => new III_psy_xmin());

  readonly en = Array.from({ length: 4 }, () => new III_psy_xmin());

  readonly tot_ener = new Float32Array(4);

  readonly loudness_sq = Array.from({ length: 2 }, () => new Float32Array(2));

  readonly loudness_sq_save = new Float32Array(2);

  readonly mld_l = new Float32Array(SBMAX_l);

  readonly mld_s = new Float32Array(SBMAX_s);

  readonly bm_l = new Int32Array(SBMAX_l);

  readonly bo_l = new Int32Array(SBMAX_l);

  readonly bm_s = new Int32Array(SBMAX_s);

  readonly bo_s = new Int32Array(SBMAX_s);

  npart_l = 0;

  npart_s = 0;

  readonly s3ind = Array.from({ length: CBANDS }, () => new Int32Array(2));

  readonly s3ind_s = Array.from({ length: CBANDS }, () => new Int32Array(2));

  readonly numlines_s = new Int32Array(CBANDS);

  readonly numlines_l = new Int32Array(CBANDS);

  readonly rnumlines_l = new Float32Array(CBANDS);

  readonly mld_cb_l = new Float32Array(CBANDS);

  readonly mld_cb_s = new Float32Array(CBANDS);

  ms_ener_ratio_old = 0;

  readonly blocktype_old = new Int32Array(2);

  readonly nsPsy = new NsPsy();

  readonly VBR_seek_table = {
    nBytesWritten: 0,
  };

  readonly ATH = new ATH();

  readonly PSY = new PSY();

  findReplayGain = false;

  findPeakSample = false;

  PeakSample = 0;

  RadioGain = 0;

  AudiophileGain = 0;

  readonly rgdata = new ReplayGain();

  noclipGainChange = 0;

  noclipScale = -1.0;

  readonly bitrate_stereoMode_Hist = Array.from(
    { length: 16 },
    () => new Int32Array(4 + 1),
  );

  readonly bitrate_blockType_Hist = Array.from(
    { length: 16 },
    () => new Int32Array(4 + 1 + 1),
  );

  in_buffer_nsamples = 0;

  in_buffer_0: Float32Array | null = null;

  in_buffer_1: Float32Array | null = null;

  iteration_loop: CBRNewIterationLoop | null = null;
}
