import { GrInfo } from './GrInfo';

export class IIISideInfo {
  tt = Array.from({ length: 2 }, () =>
    Array.from({ length: 2 }, () => new GrInfo()),
  );

  main_data_begin = 0;

  private_bits = 0;

  resvDrain_pre = 0;

  resvDrain_post = 0;

  scfsi = Array.from({ length: 2 }, () => new Int32Array(4));
}
