import { copyArray } from './arrays';
import { SBMAX_l, SBMAX_s } from './constants';

export class III_psy_xmin {
  l = new Float32Array(SBMAX_l);

  s = Array.from({ length: SBMAX_s }, () => new Float32Array(3));

  assign(iii_psy_xmin: Readonly<III_psy_xmin>) {
    copyArray(iii_psy_xmin.l, 0, this.l, 0, SBMAX_l);
    for (let i = 0; i < SBMAX_s; i++) {
      for (let j = 0; j < 3; j++) {
        this.s[i][j] = iii_psy_xmin.s[i][j];
      }
    }
  }
}
