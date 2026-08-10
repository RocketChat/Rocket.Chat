import { GainAnalysis } from './GainAnalysis';
import type { GrInfo } from './GrInfo';
import type { LameGlobalFlags } from './LameGlobalFlags';
import type { LameInternalFlags } from './LameInternalFlags';
import * as tables from './Tables';
import { Takehiro } from './Takehiro';
import { TotalBytes } from './TotalBytes';
import { VBRTag } from './VBRTag';
import { copyArray, fillArray } from './arrays';
import { assert } from './assert';
import { getBitrate } from './bitrates';
import {
  LAME_MAXMP3BUFFER,
  MAX_HEADER_BUF,
  NORM_TYPE,
  SHORT_TYPE,
} from './constants';
import { getLameShortVersion } from './getLameShortVersion';
import { isCloseToEachOther } from './math';

export class BitStream {
  private static readonly MAX_LENGTH = 32;

  readonly ga = new GainAnalysis();

  private readonly vbr = new VBRTag();

  private readonly buf = new Uint8Array(LAME_MAXMP3BUFFER);

  private totbit = 0;

  private bufByteIdx = -1;

  private bufBitIdx = 0;

  resetPointers(gfc: LameInternalFlags) {
    gfc.w_ptr = 0;
    gfc.h_ptr = 0;
    gfc.header[gfc.h_ptr].write_timing = 0;
  }

  getframebits(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;
    let bit_rate;

    if (gfc.bitrate_index !== 0) {
      bit_rate = getBitrate(gfp.version, gfc.bitrate_index);
    } else {
      bit_rate = gfp.brate;
    }
    assert(bit_rate >= 8 && bit_rate <= 640);

    const bytes = Math.trunc(
      ((gfp.version + 1) * 72000 * bit_rate) / gfp.out_samplerate + gfc.padding,
    );
    return 8 * bytes;
  }

  private putheader_bits(gfc: LameInternalFlags) {
    copyArray(
      gfc.header[gfc.w_ptr].buf,
      0,
      this.buf,
      this.bufByteIdx,
      gfc.sideinfo_len,
    );
    this.bufByteIdx += gfc.sideinfo_len;
    this.totbit += gfc.sideinfo_len * 8;
    gfc.w_ptr = (gfc.w_ptr + 1) & (MAX_HEADER_BUF - 1);
  }

  private putbits2(gfc: LameInternalFlags, val: number, j: number) {
    assert(j < BitStream.MAX_LENGTH - 2);

    while (j > 0) {
      if (this.bufBitIdx === 0) {
        this.bufBitIdx = 8;
        this.bufByteIdx++;
        assert(this.bufByteIdx < LAME_MAXMP3BUFFER);
        assert(gfc.header[gfc.w_ptr].write_timing >= this.totbit);
        if (gfc.header[gfc.w_ptr].write_timing === this.totbit) {
          this.putheader_bits(gfc);
        }
        this.buf[this.bufByteIdx] = 0;
      }

      const k = Math.min(j, this.bufBitIdx);
      j -= k;

      this.bufBitIdx -= k;

      assert(j < BitStream.MAX_LENGTH);

      assert(this.bufBitIdx < BitStream.MAX_LENGTH);

      this.buf[this.bufByteIdx] |= (val >> j) << this.bufBitIdx;
      this.totbit += k;
    }
  }

  private drain_into_ancillary(gfp: LameGlobalFlags, remainingBits: number) {
    const gfc = gfp.internal_flags;
    let i;
    assert(remainingBits >= 0);

    if (remainingBits >= 8) {
      this.putbits2(gfc, 0x4c, 8);
      remainingBits -= 8;
    }
    if (remainingBits >= 8) {
      this.putbits2(gfc, 0x41, 8);
      remainingBits -= 8;
    }
    if (remainingBits >= 8) {
      this.putbits2(gfc, 0x4d, 8);
      remainingBits -= 8;
    }
    if (remainingBits >= 8) {
      this.putbits2(gfc, 0x45, 8);
      remainingBits -= 8;
    }

    if (remainingBits >= 32) {
      const version = getLameShortVersion();
      if (remainingBits >= 32)
        for (i = 0; i < version.length && remainingBits >= 8; ++i) {
          remainingBits -= 8;
          this.putbits2(gfc, version.charCodeAt(i), 8);
        }
    }

    for (; remainingBits >= 1; remainingBits -= 1) {
      this.putbits2(gfc, 0, 1);
    }

    assert(remainingBits === 0);
  }

  private writeheader(gfc: LameInternalFlags, val: number, j: number) {
    let { ptr } = gfc.header[gfc.h_ptr];

    while (j > 0) {
      const k = Math.min(j, 8 - (ptr & 7));
      j -= k;
      assert(j < BitStream.MAX_LENGTH);

      gfc.header[gfc.h_ptr].buf[ptr >> 3] |= (val >> j) << (8 - (ptr & 7) - k);
      ptr += k;
    }
    gfc.header[gfc.h_ptr].ptr = ptr;
  }

  private encodeSideInfo2(gfp: LameGlobalFlags, bitsPerFrame: number) {
    const gfc = gfp.internal_flags;
    let gr;
    let ch;

    const { l3_side } = gfc;
    gfc.header[gfc.h_ptr].ptr = 0;
    fillArray(gfc.header[gfc.h_ptr].buf, 0, gfc.sideinfo_len, 0);
    if (gfp.out_samplerate < 16000) {
      this.writeheader(gfc, 0xffe, 12);
    } else {
      this.writeheader(gfc, 0xfff, 12);
    }
    this.writeheader(gfc, gfp.version, 1);
    this.writeheader(gfc, 4 - 3, 2);
    this.writeheader(gfc, 1, 1);
    this.writeheader(gfc, gfc.bitrate_index, 4);
    this.writeheader(gfc, gfc.samplerate_index, 2);
    this.writeheader(gfc, gfc.padding, 1);
    this.writeheader(gfc, 0, 1);
    this.writeheader(gfc, gfp.mode.ordinal, 2);
    this.writeheader(gfc, gfc.mode_ext, 2);
    this.writeheader(gfc, 0, 1);
    this.writeheader(gfc, 1, 1);
    this.writeheader(gfc, 0, 2);

    if (gfp.version === 1) {
      assert(l3_side.main_data_begin >= 0);
      this.writeheader(gfc, l3_side.main_data_begin, 9);

      if (gfc.channels_out === 2)
        this.writeheader(gfc, l3_side.private_bits, 3);
      else this.writeheader(gfc, l3_side.private_bits, 5);

      for (ch = 0; ch < gfc.channels_out; ch++) {
        for (let band = 0; band < 4; band++) {
          this.writeheader(gfc, l3_side.scfsi[ch][band], 1);
        }
      }

      for (gr = 0; gr < 2; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          const gi = l3_side.tt[gr][ch];
          this.writeheader(gfc, gi.part2_3_length + gi.part2_length, 12);
          this.writeheader(gfc, gi.big_values / 2, 9);
          this.writeheader(gfc, gi.global_gain, 8);
          this.writeheader(gfc, gi.scalefac_compress, 4);

          if (gi.block_type !== NORM_TYPE) {
            this.writeheader(gfc, 1, 1);

            this.writeheader(gfc, gi.block_type, 2);
            this.writeheader(gfc, gi.mixed_block_flag, 1);

            if (gi.table_select[0] === 14) gi.table_select[0] = 16;
            this.writeheader(gfc, gi.table_select[0], 5);
            if (gi.table_select[1] === 14) gi.table_select[1] = 16;
            this.writeheader(gfc, gi.table_select[1], 5);

            this.writeheader(gfc, gi.subblock_gain[0], 3);
            this.writeheader(gfc, gi.subblock_gain[1], 3);
            this.writeheader(gfc, gi.subblock_gain[2], 3);
          } else {
            this.writeheader(gfc, 0, 1);

            if (gi.table_select[0] === 14) gi.table_select[0] = 16;
            this.writeheader(gfc, gi.table_select[0], 5);
            if (gi.table_select[1] === 14) gi.table_select[1] = 16;
            this.writeheader(gfc, gi.table_select[1], 5);
            if (gi.table_select[2] === 14) gi.table_select[2] = 16;
            this.writeheader(gfc, gi.table_select[2], 5);

            assert(gi.region0_count >= 0 && gi.region0_count < 16);
            assert(gi.region1_count >= 0 && gi.region1_count < 8);
            this.writeheader(gfc, gi.region0_count, 4);
            this.writeheader(gfc, gi.region1_count, 3);
          }
          this.writeheader(gfc, gi.preflag, 1);
          this.writeheader(gfc, gi.scalefac_scale, 1);
          this.writeheader(gfc, gi.count1table_select, 1);
        }
      }
    } else {
      assert(l3_side.main_data_begin >= 0);
      this.writeheader(gfc, l3_side.main_data_begin, 8);
      this.writeheader(gfc, l3_side.private_bits, gfc.channels_out);

      gr = 0;
      for (ch = 0; ch < gfc.channels_out; ch++) {
        const gi = l3_side.tt[gr][ch];
        this.writeheader(gfc, gi.part2_3_length + gi.part2_length, 12);
        this.writeheader(gfc, gi.big_values / 2, 9);
        this.writeheader(gfc, gi.global_gain, 8);
        this.writeheader(gfc, gi.scalefac_compress, 9);

        if (gi.block_type !== NORM_TYPE) {
          this.writeheader(gfc, 1, 1);

          this.writeheader(gfc, gi.block_type, 2);
          this.writeheader(gfc, gi.mixed_block_flag, 1);

          if (gi.table_select[0] === 14) gi.table_select[0] = 16;
          this.writeheader(gfc, gi.table_select[0], 5);
          if (gi.table_select[1] === 14) gi.table_select[1] = 16;
          this.writeheader(gfc, gi.table_select[1], 5);

          this.writeheader(gfc, gi.subblock_gain[0], 3);
          this.writeheader(gfc, gi.subblock_gain[1], 3);
          this.writeheader(gfc, gi.subblock_gain[2], 3);
        } else {
          this.writeheader(gfc, 0, 1);

          if (gi.table_select[0] === 14) gi.table_select[0] = 16;
          this.writeheader(gfc, gi.table_select[0], 5);
          if (gi.table_select[1] === 14) gi.table_select[1] = 16;
          this.writeheader(gfc, gi.table_select[1], 5);
          if (gi.table_select[2] === 14) gi.table_select[2] = 16;
          this.writeheader(gfc, gi.table_select[2], 5);

          assert(gi.region0_count >= 0 && gi.region0_count < 16);
          assert(gi.region1_count >= 0 && gi.region1_count < 8);
          this.writeheader(gfc, gi.region0_count, 4);
          this.writeheader(gfc, gi.region1_count, 3);
        }

        this.writeheader(gfc, gi.scalefac_scale, 1);
        this.writeheader(gfc, gi.count1table_select, 1);
      }
    }

    const old = gfc.h_ptr;
    assert(gfc.header[old].ptr === gfc.sideinfo_len * 8);

    gfc.h_ptr = (old + 1) & (MAX_HEADER_BUF - 1);
    gfc.header[gfc.h_ptr].write_timing =
      gfc.header[old].write_timing + bitsPerFrame;

    if (gfc.h_ptr === gfc.w_ptr) {
      console.warn('MAX_HEADER_BUF too small in bitstream.');
    }
  }

  private huffman_coder_count1(gfc: LameInternalFlags, gi: GrInfo) {
    const h = tables.ht[gi.count1table_select + 32];
    let i;
    let bits = 0;

    let ix = gi.big_values;
    let xr = gi.big_values;
    assert(gi.count1table_select < 2);

    for (i = (gi.count1 - gi.big_values) / 4; i > 0; --i) {
      let huffbits = 0;
      let p = 0;
      let v;

      v = gi.l3_enc[ix + 0];
      if (v !== 0) {
        p += 8;
        if (gi.xr[xr + 0] < 0) huffbits++;
        assert(v <= 1);
      }

      v = gi.l3_enc[ix + 1];
      if (v !== 0) {
        p += 4;
        huffbits *= 2;
        if (gi.xr[xr + 1] < 0) huffbits++;
        assert(v <= 1);
      }

      v = gi.l3_enc[ix + 2];
      if (v !== 0) {
        p += 2;
        huffbits *= 2;
        if (gi.xr[xr + 2] < 0) huffbits++;
        assert(v <= 1);
      }

      v = gi.l3_enc[ix + 3];
      if (v !== 0) {
        p++;
        huffbits *= 2;
        if (gi.xr[xr + 3] < 0) huffbits++;
        assert(v <= 1);
      }

      assert(h.table !== undefined);
      assert(h.hlen !== undefined);

      ix += 4;
      xr += 4;
      this.putbits2(gfc, huffbits + h.table[p], h.hlen[p]);
      bits += h.hlen[p];
    }
    return bits;
  }

  private huffmancode(
    gfc: LameInternalFlags,
    tableindex: number,
    start: number,
    end: number,
    gi: GrInfo,
  ) {
    const h = tables.ht[tableindex];
    let bits = 0;

    assert(tableindex < 32);
    if (tableindex === 0) return bits;

    for (let i = start; i < end; i += 2) {
      let cbits = 0;
      let xbits = 0;
      const linbits = h.xlen;
      let { xlen } = h;
      let ext = 0;
      let x1 = gi.l3_enc[i];
      let x2 = gi.l3_enc[i + 1];

      if (x1 !== 0) {
        if (gi.xr[i] < 0) ext++;
        cbits--;
      }

      if (tableindex > 15) {
        if (x1 > 14) {
          const linbits_x1 = x1 - 15;
          assert(linbits_x1 <= h.linmax);
          ext |= linbits_x1 << 1;
          xbits = linbits;
          x1 = 15;
        }

        if (x2 > 14) {
          const linbits_x2 = x2 - 15;
          assert(linbits_x2 <= h.linmax);
          ext <<= linbits;
          ext |= linbits_x2;
          xbits += linbits;
          x2 = 15;
        }
        xlen = 16;
      }

      if (x2 !== 0) {
        ext <<= 1;
        if (gi.xr[i + 1] < 0) ext++;
        cbits--;
      }

      assert((x1 | x2) < 16);
      assert(h.hlen !== undefined);
      assert(h.table !== undefined);

      x1 = x1 * xlen + x2;
      xbits -= cbits;
      cbits += h.hlen[x1];

      assert(cbits <= BitStream.MAX_LENGTH);
      assert(xbits <= BitStream.MAX_LENGTH);
      assert(h.table !== undefined);

      this.putbits2(gfc, h.table[x1], cbits);
      this.putbits2(gfc, ext, xbits);
      bits += cbits + xbits;
    }
    return bits;
  }

  private shortHuffmancodebits(gfc: LameInternalFlags, gi: GrInfo) {
    let region1Start = 3 * gfc.scalefac_band.s[3];
    if (region1Start > gi.big_values) region1Start = gi.big_values;

    let bits = this.huffmancode(gfc, gi.table_select[0], 0, region1Start, gi);
    bits += this.huffmancode(
      gfc,
      gi.table_select[1],
      region1Start,
      gi.big_values,
      gi,
    );
    return bits;
  }

  private longHuffmancodebits(gfc: LameInternalFlags, gi: GrInfo) {
    let bits;
    let region1Start;
    let region2Start;

    const bigvalues = gi.big_values;
    assert(bigvalues >= 0 && bigvalues <= 576);

    let i = gi.region0_count + 1;
    assert(i >= 0);
    assert(i < gfc.scalefac_band.l.length);
    region1Start = gfc.scalefac_band.l[i];
    i += gi.region1_count + 1;
    assert(i >= 0);
    assert(i < gfc.scalefac_band.l.length);
    region2Start = gfc.scalefac_band.l[i];

    if (region1Start > bigvalues) {
      region1Start = bigvalues;
    }

    if (region2Start > bigvalues) {
      region2Start = bigvalues;
    }

    bits = this.huffmancode(gfc, gi.table_select[0], 0, region1Start, gi);
    bits += this.huffmancode(
      gfc,
      gi.table_select[1],
      region1Start,
      region2Start,
      gi,
    );
    bits += this.huffmancode(
      gfc,
      gi.table_select[2],
      region2Start,
      bigvalues,
      gi,
    );
    return bits;
  }

  private writeMainData(gfp: LameGlobalFlags) {
    let gr;
    let ch;
    let sfb;
    let data_bits;
    let tot_bits = 0;
    const gfc = gfp.internal_flags;
    const { l3_side } = gfc;

    if (gfp.version === 1) {
      for (gr = 0; gr < 2; gr++) {
        for (ch = 0; ch < gfc.channels_out; ch++) {
          const gi = l3_side.tt[gr][ch];
          const slen1 = Takehiro.slen1_tab[gi.scalefac_compress];
          const slen2 = Takehiro.slen2_tab[gi.scalefac_compress];
          data_bits = 0;
          for (sfb = 0; sfb < gi.sfbdivide; sfb++) {
            if (gi.scalefac[sfb] === -1) {
              continue;
            }

            this.putbits2(gfc, gi.scalefac[sfb], slen1);
            data_bits += slen1;
          }
          for (; sfb < gi.sfbmax; sfb++) {
            if (gi.scalefac[sfb] === -1) {
              continue;
            }

            this.putbits2(gfc, gi.scalefac[sfb], slen2);
            data_bits += slen2;
          }
          assert(data_bits === gi.part2_length);

          if (gi.block_type === SHORT_TYPE) {
            data_bits += this.shortHuffmancodebits(gfc, gi);
          } else {
            data_bits += this.longHuffmancodebits(gfc, gi);
          }
          data_bits += this.huffman_coder_count1(gfc, gi);

          assert(data_bits === gi.part2_3_length + gi.part2_length);
          tot_bits += data_bits;
        }
      }
      return tot_bits;
    }

    gr = 0;
    for (ch = 0; ch < gfc.channels_out; ch++) {
      const gi = l3_side.tt[gr][ch];
      let i;
      let sfb_partition;
      let scale_bits = 0;
      assert(gi.sfb_partition_table !== null);
      data_bits = 0;
      sfb = 0;
      sfb_partition = 0;

      if (gi.block_type === SHORT_TYPE) {
        for (; sfb_partition < 4; sfb_partition++) {
          const sfbs = gi.sfb_partition_table[sfb_partition] / 3;
          const slen = gi.slen[sfb_partition];
          for (i = 0; i < sfbs; i++, sfb++) {
            this.putbits2(gfc, Math.max(gi.scalefac[sfb * 3 + 0], 0), slen);
            this.putbits2(gfc, Math.max(gi.scalefac[sfb * 3 + 1], 0), slen);
            this.putbits2(gfc, Math.max(gi.scalefac[sfb * 3 + 2], 0), slen);
            scale_bits += 3 * slen;
          }
        }
        data_bits += this.shortHuffmancodebits(gfc, gi);
      } else {
        for (; sfb_partition < 4; sfb_partition++) {
          const sfbs = gi.sfb_partition_table[sfb_partition];
          const slen = gi.slen[sfb_partition];
          for (i = 0; i < sfbs; i++, sfb++) {
            this.putbits2(gfc, Math.max(gi.scalefac[sfb], 0), slen);
            scale_bits += slen;
          }
        }
        data_bits += this.longHuffmancodebits(gfc, gi);
      }
      data_bits += this.huffman_coder_count1(gfc, gi);

      assert(data_bits === gi.part2_3_length);
      assert(scale_bits === gi.part2_length);
      tot_bits += scale_bits + data_bits;
    }

    return tot_bits;
  }

  private compute_flushbits(
    gfp: LameGlobalFlags,
    total_bytes_output: TotalBytes,
  ) {
    const gfc = gfp.internal_flags;
    let flushbits;
    let remaining_headers;
    let last_ptr;
    const first_ptr = gfc.w_ptr;

    last_ptr = gfc.h_ptr - 1;

    if (last_ptr === -1) last_ptr = MAX_HEADER_BUF - 1;

    flushbits = gfc.header[last_ptr].write_timing - this.totbit;
    total_bytes_output.total = flushbits;

    if (flushbits >= 0) {
      remaining_headers = 1 + last_ptr - first_ptr;
      if (last_ptr < first_ptr) {
        remaining_headers = 1 + last_ptr - first_ptr + MAX_HEADER_BUF;
      }
      flushbits -= remaining_headers * 8 * gfc.sideinfo_len;
    }

    const bitsPerFrame = this.getframebits(gfp);
    flushbits += bitsPerFrame;
    total_bytes_output.total += bitsPerFrame;

    if (total_bytes_output.total % 8 !== 0)
      total_bytes_output.total = 1 + total_bytes_output.total / 8;
    else total_bytes_output.total /= 8;
    total_bytes_output.total += this.bufByteIdx + 1;

    if (flushbits < 0) {
      console.warn('strange error flushing buffer ... ');
    }
    return flushbits;
  }

  flush_bitstream(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;
    let flushbits;
    let last_ptr = gfc.h_ptr - 1;

    if (last_ptr === -1) last_ptr = MAX_HEADER_BUF - 1;
    const { l3_side } = gfc;

    if ((flushbits = this.compute_flushbits(gfp, new TotalBytes())) < 0) return;
    this.drain_into_ancillary(gfp, flushbits);

    assert(
      gfc.header[last_ptr].write_timing + this.getframebits(gfp) ===
        this.totbit,
    );

    gfc.ResvSize = 0;
    l3_side.main_data_begin = 0;

    if (gfc.findReplayGain) {
      const radioGain = this.ga.getTitleGain(gfc.rgdata);
      assert(
        !isCloseToEachOther(radioGain, GainAnalysis.GAIN_NOT_ENOUGH_SAMPLES),
      );
      gfc.RadioGain = Math.floor(radioGain * 10.0 + 0.5);
    }

    if (gfc.findPeakSample) {
      gfc.noclipGainChange = Math.ceil(
        Math.log10(gfc.PeakSample / 32767.0) * 20.0 * 10.0,
      );

      if (gfc.noclipGainChange > 0) {
        if (
          isCloseToEachOther(gfp.scale, 1.0) ||
          isCloseToEachOther(gfp.scale, 0.0)
        ) {
          gfc.noclipScale =
            Math.floor((32767.0 / gfc.PeakSample) * 100.0) / 100.0;
        } else {
          gfc.noclipScale = -1;
        }
      } else {
        gfc.noclipScale = -1;
      }
    }
  }

  format_bitstream(gfp: LameGlobalFlags) {
    const gfc = gfp.internal_flags;
    const { l3_side } = gfc;

    const bitsPerFrame = this.getframebits(gfp);
    this.drain_into_ancillary(gfp, l3_side.resvDrain_pre);

    this.encodeSideInfo2(gfp, bitsPerFrame);
    let bits = 8 * gfc.sideinfo_len;
    bits += this.writeMainData(gfp);
    this.drain_into_ancillary(gfp, l3_side.resvDrain_post);
    bits += l3_side.resvDrain_post;

    l3_side.main_data_begin += (bitsPerFrame - bits) / 8;

    if (this.compute_flushbits(gfp, new TotalBytes()) !== gfc.ResvSize) {
      console.warn('Internal buffer inconsistency. flushbits <> ResvSize');
    }

    if (l3_side.main_data_begin * 8 !== gfc.ResvSize) {
      console.warn(
        `bit reservoir error: \n` +
          `l3_side.main_data_begin: ${8 * l3_side.main_data_begin} \n` +
          `Resvoir size:             ${gfc.ResvSize} \n` +
          `resv drain (post)         ${l3_side.resvDrain_post} \n` +
          `resv drain (pre)          ${l3_side.resvDrain_pre} \n` +
          `header and sideinfo:      ${8 * gfc.sideinfo_len} \n` +
          `data bits:                ${
            bits - l3_side.resvDrain_post - 8 * gfc.sideinfo_len
          } \n` +
          `total bits:               ${bits} (remainder: ${bits % 8}) \n` +
          `bitsperframe:             ${bitsPerFrame}`,
      );

      console.warn('This is a fatal error.  It has several possible causes:');
      console.warn(
        '90%%  LAME compiled with buggy version of gcc using advanced optimizations',
      );
      console.warn(' 9%%  Your system is overclocked');
      console.warn(' 1%%  bug in LAME encoding library');

      gfc.ResvSize = l3_side.main_data_begin * 8;
    }
    assert(this.totbit % 8 === 0);

    if (this.totbit > 1000000000) {
      for (let i = 0; i < MAX_HEADER_BUF; ++i) {
        gfc.header[i].write_timing -= this.totbit;
      }
      this.totbit = 0;
    }

    return 0;
  }

  copyMetadata(
    gfc: LameInternalFlags,
    buffer: Uint8Array,
    bufferPos: number,
    size: number,
  ) {
    return this.copyBuffer(gfc, buffer, bufferPos, size, false);
  }

  copyFrameData(
    gfc: LameInternalFlags,
    buffer: Uint8Array,
    bufferPos: number,
    size: number,
  ) {
    return this.copyBuffer(gfc, buffer, bufferPos, size, true);
  }

  private copyBuffer(
    gfc: LameInternalFlags,
    buffer: Uint8Array,
    bufferPos: number,
    size: number,
    mp3data: boolean,
  ) {
    const minimum = this.bufByteIdx + 1;
    if (minimum <= 0) {
      return 0;
    }

    if (size !== 0 && minimum > size) {
      return -1;
    }

    copyArray(this.buf, 0, buffer, bufferPos, minimum);
    this.bufByteIdx = -1;
    this.bufBitIdx = 0;

    if (mp3data) {
      const crc = new Int32Array(1);
      crc[0] = gfc.nMusicCRC;
      this.vbr.updateMusicCRC(crc, buffer, bufferPos, minimum);
      gfc.nMusicCRC = crc[0];

      if (minimum > 0) {
        gfc.VBR_seek_table.nBytesWritten += minimum;
      }
    }

    return minimum;
  }
}
