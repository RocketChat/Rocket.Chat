import type { BitStream } from './BitStream';
import { III_psy_ratio } from './III_psy_ratio';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { LameInternalFlags } from './LameInternalFlags';
import { MPEGMode } from './MPEGMode';
import { NewMDCT } from './NewMDCT';
import type { PsyModel } from './PsyModel';
import { VbrMode } from './VbrMode';
import { assert } from './assert';
import {
  BLKSIZE,
  FFTOFFSET,
  MPG_MD_LR_LR,
  MPG_MD_MS_LR,
  NORM_TYPE,
  SHORT_TYPE,
} from './constants';

export class Encoder {
  private readonly bs: BitStream;

  private readonly psy: PsyModel;

  constructor(bs: BitStream, psy: PsyModel) {
    this.bs = bs;
    this.psy = psy;
  }

  private newMDCT = new NewMDCT();

  private adjust_ATH(gfc: LameInternalFlags) {
    if (gfc.ATH.useAdjust === 0) {
      gfc.ATH.adjust = 1.0;

      return;
    }

    let max_pow = gfc.loudness_sq[0][0];
    let gr2_max = gfc.loudness_sq[1][0];
    if (gfc.channels_out === 2) {
      max_pow += gfc.loudness_sq[0][1];
      gr2_max += gfc.loudness_sq[1][1];
    } else {
      max_pow += max_pow;
      gr2_max += gr2_max;
    }
    if (gfc.mode_gr === 2) {
      max_pow = Math.max(max_pow, gr2_max);
    }
    max_pow *= 0.5;

    max_pow *= gfc.ATH.aaSensitivityP;

    if (max_pow > 0.03125) {
      if (gfc.ATH.adjust >= 1.0) {
        gfc.ATH.adjust = 1.0;
      } else if (gfc.ATH.adjust < gfc.ATH.adjustLimit) {
        gfc.ATH.adjust = gfc.ATH.adjustLimit;
      }

      gfc.ATH.adjustLimit = 1.0;
    } else {
      const adj_lim_new = 31.98 * max_pow + 0.000625;
      if (gfc.ATH.adjust >= adj_lim_new) {
        gfc.ATH.adjust *= adj_lim_new * 0.075 + 0.925;
        if (gfc.ATH.adjust < adj_lim_new) {
          gfc.ATH.adjust = adj_lim_new;
        }
      } else if (gfc.ATH.adjustLimit >= adj_lim_new) {
        gfc.ATH.adjust = adj_lim_new;
      } else if (gfc.ATH.adjust < gfc.ATH.adjustLimit) {
        gfc.ATH.adjust = gfc.ATH.adjustLimit;
      }

      gfc.ATH.adjustLimit = adj_lim_new;
    }
  }

  private updateStats(gfc: LameInternalFlags) {
    let gr;
    let ch;
    assert(gfc.bitrate_index >= 0 && gfc.bitrate_index < 16);
    assert(gfc.mode_ext >= 0 && gfc.mode_ext < 4);

    gfc.bitrate_stereoMode_Hist[gfc.bitrate_index][4]++;
    gfc.bitrate_stereoMode_Hist[15][4]++;

    if (gfc.channels_out === 2) {
      gfc.bitrate_stereoMode_Hist[gfc.bitrate_index][gfc.mode_ext]++;
      gfc.bitrate_stereoMode_Hist[15][gfc.mode_ext]++;
    }
    for (gr = 0; gr < gfc.mode_gr; ++gr) {
      for (ch = 0; ch < gfc.channels_out; ++ch) {
        let bt = Math.trunc(gfc.l3_side.tt[gr][ch].block_type);
        if (gfc.l3_side.tt[gr][ch].mixed_block_flag !== 0) bt = 4;
        gfc.bitrate_blockType_Hist[gfc.bitrate_index][bt]++;
        gfc.bitrate_blockType_Hist[gfc.bitrate_index][5]++;
        gfc.bitrate_blockType_Hist[15][bt]++;
        gfc.bitrate_blockType_Hist[15][5]++;
      }
    }
  }

  private lame_encode_frame_init(
    gfp: LameGlobalFlags,
    inbuf: [Float32Array, Float32Array],
  ) {
    const gfc = gfp.internal_flags;

    let ch;
    let gr;

    if (!gfc.lame_encode_frame_init) {
      let i;
      let j;
      const primebuff0 = new Float32Array(286 + 1152 + 576);
      const primebuff1 = new Float32Array(286 + 1152 + 576);
      gfc.lame_encode_frame_init = true;
      for (i = 0, j = 0; i < 286 + 576 * (1 + gfc.mode_gr); ++i) {
        if (i < 576 * gfc.mode_gr) {
          primebuff0[i] = 0;
          if (gfc.channels_out === 2) primebuff1[i] = 0;
        } else {
          primebuff0[i] = inbuf[0][j];
          if (gfc.channels_out === 2) primebuff1[i] = inbuf[1][j];
          ++j;
        }
      }

      for (gr = 0; gr < gfc.mode_gr; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          gfc.l3_side.tt[gr][ch].block_type = SHORT_TYPE;
        }
      }
      this.newMDCT.mdct_sub48(gfc, primebuff0, primebuff1);

      assert(FFTOFFSET <= 576);

      assert(gfc.mf_size >= BLKSIZE + gfp.framesize - FFTOFFSET);

      assert(gfc.mf_size >= 512 + gfp.framesize - 32);
    }
  }

  lame_encode_mp3_frame(
    gfp: LameGlobalFlags,
    inbuf_l: Float32Array,
    inbuf_r: Float32Array,
    mp3buf: Uint8Array,
    mp3bufPos: number,
    mp3buf_size: number,
  ) {
    const masking_LR = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => new III_psy_ratio()),
    );

    const masking_MS = Array.from({ length: 2 }, () =>
      Array.from({ length: 2 }, () => new III_psy_ratio()),
    );

    masking_MS[0][0] = new III_psy_ratio();
    masking_MS[0][1] = new III_psy_ratio();
    masking_MS[1][0] = new III_psy_ratio();
    masking_MS[1][1] = new III_psy_ratio();

    let masking;

    const gfc = gfp.internal_flags;

    const tot_ener = Array.from({ length: 2 }, () => new Float32Array(4));
    const ms_ener_ratio = [0.5, 0.5];
    const pe = [
      [0, 0],
      [0, 0],
    ];
    const pe_MS = [
      [0, 0],
      [0, 0],
    ];

    let pe_use;

    let ch;
    let gr;

    const inbuf: [Float32Array, Float32Array] = [inbuf_l, inbuf_r];

    if (!gfc.lame_encode_frame_init) {
      this.lame_encode_frame_init(gfp, inbuf);
    }

    gfc.padding = 0;
    if ((gfc.slot_lag -= gfc.frac_SpF) < 0) {
      gfc.slot_lag += gfp.out_samplerate;
      gfc.padding = 1;
    }

    if (gfc.psymodel !== 0) {
      let ret;

      let bufpPos = 0;

      const blocktype = new Int32Array(2);

      const bufp: Float32Array[] = [];

      for (gr = 0; gr < gfc.mode_gr; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          bufp[ch] = inbuf[ch];
          bufpPos = 576 + gr * 576 - FFTOFFSET;
        }
        if (gfp.VBR === VbrMode.vbr_mtrh || gfp.VBR === VbrMode.vbr_mt) {
          ret = this.psy.L3psycho_anal_vbr(
            gfp,
            bufp,
            bufpPos,
            gr,
            masking_LR,
            masking_MS,
            pe[gr],
            pe_MS[gr],
            tot_ener[gr],
            blocktype,
          );
        } else {
          ret = this.psy.L3psycho_anal_ns(
            gfp,
            bufp,
            bufpPos,
            gr,
            masking_LR,
            masking_MS,
            pe[gr],
            pe_MS[gr],
            tot_ener[gr],
            blocktype,
          );
        }
        if (ret !== 0) return -4;

        if (gfp.mode === MPEGMode.JOINT_STEREO) {
          ms_ener_ratio[gr] = tot_ener[gr][2] + tot_ener[gr][3];
          if (ms_ener_ratio[gr] > 0)
            ms_ener_ratio[gr] = tot_ener[gr][3] / ms_ener_ratio[gr];
        }

        for (ch = 0; ch < gfc.channels_out; ch++) {
          const cod_info = gfc.l3_side.tt[gr][ch];
          cod_info.block_type = blocktype[ch];
          cod_info.mixed_block_flag = 0;
        }
      }
    } else {
      for (gr = 0; gr < gfc.mode_gr; gr++)
        for (ch = 0; ch < gfc.channels_out; ch++) {
          gfc.l3_side.tt[gr][ch].block_type = NORM_TYPE;
          gfc.l3_side.tt[gr][ch].mixed_block_flag = 0;
          pe_MS[gr][ch] = 700;
          pe[gr][ch] = 700;
        }
    }

    this.adjust_ATH(gfc);

    this.newMDCT.mdct_sub48(gfc, inbuf[0], inbuf[1]);

    gfc.mode_ext = MPG_MD_LR_LR;

    if (gfp.mode === MPEGMode.JOINT_STEREO) {
      let sum_pe_MS = 0;
      let sum_pe_LR = 0;
      for (gr = 0; gr < gfc.mode_gr; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          sum_pe_MS += pe_MS[gr][ch];
          sum_pe_LR += pe[gr][ch];
        }
      }

      if (sum_pe_MS <= 1.0 * sum_pe_LR) {
        const gi0 = gfc.l3_side.tt[0];
        const gi1 = gfc.l3_side.tt[gfc.mode_gr - 1];

        if (
          gi0[0].block_type === gi0[1].block_type &&
          gi1[0].block_type === gi1[1].block_type
        ) {
          gfc.mode_ext = MPG_MD_MS_LR;
        }
      }
    }

    if (gfc.mode_ext === MPG_MD_MS_LR) {
      masking = masking_MS;

      pe_use = pe_MS;
    } else {
      masking = masking_LR;

      pe_use = pe;
    }

    if (gfp.VBR === VbrMode.vbr_off || gfp.VBR === VbrMode.vbr_abr) {
      let i;
      let f;

      for (i = 0; i < 18; i++)
        gfc.nsPsy.pefirbuf[i] = gfc.nsPsy.pefirbuf[i + 1];

      f = 0.0;
      for (gr = 0; gr < gfc.mode_gr; gr++)
        for (ch = 0; ch < gfc.channels_out; ch++) f += pe_use[gr][ch];
      gfc.nsPsy.pefirbuf[18] = f;

      f = gfc.nsPsy.pefirbuf[9];
      for (i = 0; i < 9; i++)
        f +=
          (gfc.nsPsy.pefirbuf[i] + gfc.nsPsy.pefirbuf[18 - i]) *
          Encoder.fircoef[i];

      f = (670 * 5 * gfc.mode_gr * gfc.channels_out) / f;
      for (gr = 0; gr < gfc.mode_gr; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          pe_use[gr][ch] *= f;
        }
      }
    }
    assert(gfc.iteration_loop !== null);
    gfc.iteration_loop.iteration_loop(gfp, pe_use, ms_ener_ratio, masking);

    this.bs.format_bitstream(gfp);

    const mp3count = this.bs.copyFrameData(gfc, mp3buf, mp3bufPos, mp3buf_size);

    this.updateStats(gfc);

    return mp3count;
  }

  static fircoef = [
    -0.0207887 * 5,
    -0.0378413 * 5,
    -0.0432472 * 5,
    -0.031183 * 5,
    7.79609e-18 * 5,
    0.0467745 * 5,
    0.10091 * 5,
    0.151365 * 5,
    0.187098 * 5,
  ] as const;
}
