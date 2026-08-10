import { SBMAX_l, SBMAX_s } from './constants';

export class PSY {
  mask_adjust = 0;

  mask_adjust_short = 0;

  readonly bo_l_weight = new Float32Array(SBMAX_l);

  readonly bo_s_weight = new Float32Array(SBMAX_s);
}
