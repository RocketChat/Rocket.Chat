export class MPEGMode {
  private constructor(public readonly ordinal: number) {}

  static readonly STEREO = new MPEGMode(0);

  static readonly JOINT_STEREO = new MPEGMode(1);

  static readonly DUAL_CHANNEL = new MPEGMode(2);

  static readonly MONO = new MPEGMode(3);

  static readonly NOT_SET = new MPEGMode(4);
}
