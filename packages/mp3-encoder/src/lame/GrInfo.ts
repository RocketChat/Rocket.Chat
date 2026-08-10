import { SFBMAX } from './constants';

export class GrInfo {
  xr = new Float32Array(576);

  l3_enc = new Int32Array(576);

  scalefac = new Int32Array(SFBMAX);

  xrpow_max = 0;

  part2_3_length = 0;

  big_values = 0;

  count1 = 0;

  global_gain = 0;

  scalefac_compress = 0;

  block_type = 0;

  mixed_block_flag = 0;

  table_select = new Int32Array(3);

  subblock_gain = new Int32Array(3 + 1);

  region0_count = 0;

  region1_count = 0;

  preflag = 0;

  scalefac_scale = 0;

  count1table_select = 0;

  part2_length = 0;

  sfb_lmax = 0;

  sfb_smin = 0;

  psy_lmax = 0;

  sfbmax = 0;

  psymax = 0;

  sfbdivide = 0;

  width = new Int32Array(SFBMAX);

  window = new Int32Array(SFBMAX);

  count1bits = 0;

  sfb_partition_table: readonly number[] | null = null;

  slen = new Int32Array(4);

  max_nonzero_coeff = 0;

  assign(other: GrInfo) {
    this.xr = new Float32Array(other.xr);
    this.l3_enc = new Int32Array(other.l3_enc);
    this.scalefac = new Int32Array(other.scalefac);
    this.xrpow_max = other.xrpow_max;

    this.part2_3_length = other.part2_3_length;
    this.big_values = other.big_values;
    this.count1 = other.count1;
    this.global_gain = other.global_gain;
    this.scalefac_compress = other.scalefac_compress;
    this.block_type = other.block_type;
    this.mixed_block_flag = other.mixed_block_flag;
    this.table_select = new Int32Array(other.table_select);
    this.subblock_gain = new Int32Array(other.subblock_gain);
    this.region0_count = other.region0_count;
    this.region1_count = other.region1_count;
    this.preflag = other.preflag;
    this.scalefac_scale = other.scalefac_scale;
    this.count1table_select = other.count1table_select;

    this.part2_length = other.part2_length;
    this.sfb_lmax = other.sfb_lmax;
    this.sfb_smin = other.sfb_smin;
    this.psy_lmax = other.psy_lmax;
    this.sfbmax = other.sfbmax;
    this.psymax = other.psymax;
    this.sfbdivide = other.sfbdivide;
    this.width = new Int32Array(other.width);
    this.window = new Int32Array(other.window);
    this.count1bits = other.count1bits;

    this.sfb_partition_table =
      other.sfb_partition_table !== null
        ? Array.from(other.sfb_partition_table)
        : null;
    this.slen = new Int32Array(other.slen);
    this.max_nonzero_coeff = other.max_nonzero_coeff;
  }
}
