import type { BitStream } from './BitStream';
import type { GrInfo } from './GrInfo';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { LameInternalFlags } from './LameInternalFlags';
import type { MeanBits } from './MeanBits';
import { assert } from './assert';

export class Reservoir {
  private bs: BitStream | undefined;

  constructor(bs: BitStream) {
    this.bs = bs;
  }

  ResvFrameBegin(gfp: LameGlobalFlags, mean_bits: MeanBits) {
    const gfc = gfp.internal_flags;
    let maxmp3buf;
    const { l3_side } = gfc;

    const frameLength = this.bs?.getframebits(gfp) ?? 0;
    mean_bits.bits = (frameLength - gfc.sideinfo_len * 8) / gfc.mode_gr;

    if (gfp.brate > 320) {
      maxmp3buf =
        8 *
        Math.trunc((gfp.brate * 1000) / (gfp.out_samplerate / 1152) / 8 + 0.5);
    } else {
      maxmp3buf = 8 * 1440;
    }

    let fullFrameBits =
      mean_bits.bits * gfc.mode_gr + Math.min(gfc.ResvSize, 0);

    if (fullFrameBits > maxmp3buf) fullFrameBits = maxmp3buf;

    l3_side.resvDrain_pre = 0;

    return fullFrameBits;
  }

  ResvMaxBits(
    gfp: LameGlobalFlags,
    mean_bits: number,
    targ_bits: MeanBits,
    cbr: number,
  ) {
    const gfc = gfp.internal_flags;
    let add_bits;
    let { ResvSize } = gfc;

    if (cbr !== 0) ResvSize += mean_bits;

    targ_bits.bits = mean_bits;

    if (ResvSize * 10 > 0) {
      add_bits = ResvSize;
      targ_bits.bits += add_bits;
      gfc.substep_shaping |= 0x80;
    } else {
      add_bits = 0;
      gfc.substep_shaping &= 0x7f;
    }

    let extra_bits = ResvSize < 0 ? ResvSize : 0;
    extra_bits -= add_bits;

    if (extra_bits < 0) extra_bits = 0;
    return extra_bits;
  }

  ResvAdjust(gfc: LameInternalFlags, gi: GrInfo) {
    gfc.ResvSize -= gi.part2_3_length + gi.part2_length;
  }

  ResvFrameEnd(gfc: LameInternalFlags, mean_bits: number) {
    let over_bits;
    const { l3_side } = gfc;

    gfc.ResvSize += mean_bits * gfc.mode_gr;
    let stuffingBits = 0;
    l3_side.resvDrain_post = 0;
    l3_side.resvDrain_pre = 0;

    if ((over_bits = gfc.ResvSize % 8) !== 0) stuffingBits += over_bits;

    over_bits = gfc.ResvSize - stuffingBits;
    if (over_bits > 0) {
      assert(over_bits % 8 === 0);
      assert(over_bits >= 0);
      stuffingBits += over_bits;
    }

    const mdb_bytes = Math.min(l3_side.main_data_begin * 8, stuffingBits) / 8;
    l3_side.resvDrain_pre += 8 * mdb_bytes;
    stuffingBits -= 8 * mdb_bytes;
    gfc.ResvSize -= 8 * mdb_bytes;
    l3_side.main_data_begin -= mdb_bytes;

    l3_side.resvDrain_post += stuffingBits;
    gfc.ResvSize -= stuffingBits;
  }
}
