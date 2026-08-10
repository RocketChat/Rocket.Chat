import type { III_psy_ratio } from './III_psy_ratio';
import type { LameGlobalFlags } from './LameGlobalFlags';
import { MeanBits } from './MeanBits';
import type { Quantize } from './Quantize';
import { assert } from './assert';
import {
  MAX_BITS_PER_CHANNEL,
  MAX_BITS_PER_GRANULE,
  MPG_MD_MS_LR,
  SFBMAX,
  SHORT_TYPE,
} from './constants';

export class CBRNewIterationLoop {
  constructor(public quantize: Quantize) {}

  iteration_loop(
    gfp: LameGlobalFlags,
    pe: number[][],
    ms_ener_ratio: number[],
    ratio: III_psy_ratio[][],
  ) {
    const gfc = gfp.internal_flags;
    const l3_xmin = new Float32Array(SFBMAX);
    const xrpow = new Float32Array(576);
    const targ_bits = new Int32Array(2);
    let mean_bits = 0;
    let max_bits;
    const { l3_side } = gfc;

    const mb = new MeanBits(mean_bits);
    this.quantize.rv.ResvFrameBegin(gfp, mb);
    mean_bits = mb.bits;

    for (let gr = 0; gr < gfc.mode_gr; gr++) {
      max_bits = this.on_pe(gfp, pe, targ_bits, mean_bits, gr, gr);

      if (gfc.mode_ext === MPG_MD_MS_LR) {
        this.quantize.ms_convert(gfc.l3_side, gr);
        this.quantize.qupvt.reduce_side(
          targ_bits,
          ms_ener_ratio[gr],
          mean_bits,
          max_bits,
        );
      }

      for (let ch = 0; ch < gfc.channels_out; ch++) {
        let adjust;
        let masking_lower_db;
        const cod_info = l3_side.tt[gr][ch];

        if (cod_info.block_type !== SHORT_TYPE) {
          // NORM, START or STOP type
          adjust = 0;
          masking_lower_db = gfc.PSY.mask_adjust - adjust;
        } else {
          adjust = 0;
          masking_lower_db = gfc.PSY.mask_adjust_short - adjust;
        }
        gfc.masking_lower = Math.pow(10.0, masking_lower_db * 0.1);

        this.quantize.init_outer_loop(gfc, cod_info);
        if (this.quantize.init_xrpow(gfc, cod_info, xrpow)) {
          this.quantize.qupvt.calc_xmin(gfp, ratio[gr][ch], cod_info, l3_xmin);
          this.quantize.outer_loop(
            gfp,
            cod_info,
            l3_xmin,
            xrpow,
            ch,
            targ_bits[ch],
          );
        }

        this.quantize.iteration_finish_one(gfc, gr, ch);
        assert(cod_info.part2_3_length <= MAX_BITS_PER_CHANNEL);
        assert(cod_info.part2_3_length <= targ_bits[ch]);
      }
    }

    this.quantize.rv.ResvFrameEnd(gfc, mean_bits);
  }

  private on_pe(
    gfp: LameGlobalFlags,
    pe: number[][],
    targ_bits: Int32Array,
    mean_bits: number,
    gr: number,
    cbr: number,
  ) {
    const gfc = gfp.internal_flags;
    let tbits = 0;
    let bits;
    const add_bits = new Int32Array(2);
    let ch;

    const mb = new MeanBits(tbits);
    let extra_bits = this.quantize.rv.ResvMaxBits(gfp, mean_bits, mb, cbr);
    tbits = mb.bits;

    let max_bits = tbits + extra_bits;
    if (max_bits > MAX_BITS_PER_GRANULE) {
      max_bits = MAX_BITS_PER_GRANULE;
    }
    for (bits = 0, ch = 0; ch < gfc.channels_out; ++ch) {
      targ_bits[ch] = Math.min(MAX_BITS_PER_CHANNEL, tbits / gfc.channels_out);

      add_bits[ch] = Math.trunc(
        (targ_bits[ch] * pe[gr][ch]) / 700.0 - targ_bits[ch],
      );

      if (add_bits[ch] > (mean_bits * 3) / 4)
        add_bits[ch] = (mean_bits * 3) / 4;
      if (add_bits[ch] < 0) add_bits[ch] = 0;

      if (add_bits[ch] + targ_bits[ch] > MAX_BITS_PER_CHANNEL)
        add_bits[ch] = Math.max(0, MAX_BITS_PER_CHANNEL - targ_bits[ch]);

      bits += add_bits[ch];
    }
    if (bits > extra_bits) {
      for (ch = 0; ch < gfc.channels_out; ++ch) {
        add_bits[ch] = (extra_bits * add_bits[ch]) / bits;
      }
    }

    for (ch = 0; ch < gfc.channels_out; ++ch) {
      targ_bits[ch] += add_bits[ch];
      extra_bits -= add_bits[ch];
    }

    for (bits = 0, ch = 0; ch < gfc.channels_out; ++ch) {
      bits += targ_bits[ch];
    }
    if (bits > MAX_BITS_PER_GRANULE) {
      let sum = 0;
      for (ch = 0; ch < gfc.channels_out; ++ch) {
        targ_bits[ch] *= MAX_BITS_PER_GRANULE;
        targ_bits[ch] /= bits;
        sum += targ_bits[ch];
      }
      assert(sum <= MAX_BITS_PER_GRANULE);
    }

    return max_bits;
  }
}
