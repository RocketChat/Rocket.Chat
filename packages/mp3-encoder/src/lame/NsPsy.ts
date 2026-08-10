import { SBMAX_l, SBMAX_s } from './constants';

export class NsPsy {
  last_en_subshort = Array.from({ length: 4 }, () => new Float32Array(9));

  lastAttacks = new Int32Array(4);

  pefirbuf = new Float32Array(19);

  longfact = new Float32Array(SBMAX_l);

  shortfact = new Float32Array(SBMAX_s);

  attackthre = -1;

  attackthre_s = -1;
}
