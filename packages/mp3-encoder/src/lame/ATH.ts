import { BLKSIZE, CBANDS, PSFB12, PSFB21, SBMAX_l, SBMAX_s } from './constants';

export class ATH {
  useAdjust = 0;

  aaSensitivityP = 0;

  adjust = 0;

  adjustLimit = 0;

  decay = 0;

  floor = 0;

  readonly l = new Float32Array(SBMAX_l);

  readonly s = new Float32Array(SBMAX_s);

  readonly psfb21 = new Float32Array(PSFB21);

  readonly psfb12 = new Float32Array(PSFB12);

  readonly cb_l = new Float32Array(CBANDS);

  readonly cb_s = new Float32Array(CBANDS);

  readonly eql_w = new Float32Array(BLKSIZE / 2);
}
