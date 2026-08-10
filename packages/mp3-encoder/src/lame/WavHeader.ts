export class WavHeader {
  private constructor(
    public readonly dataOffset: number,
    public readonly dataLen: number,
    public readonly channels: number,
    public readonly sampleRate: number,
  ) {}

  private static fourccToInt(fourcc: string) {
    return (
      (fourcc.charCodeAt(0) << 24) |
      (fourcc.charCodeAt(1) << 16) |
      (fourcc.charCodeAt(2) << 8) |
      fourcc.charCodeAt(3)
    );
  }

  private static readonly RIFF = WavHeader.fourccToInt('RIFF');

  private static readonly WAVE = WavHeader.fourccToInt('WAVE');

  private static readonly fmt_ = WavHeader.fourccToInt('fmt ');

  private static readonly data = WavHeader.fourccToInt('data');

  static readHeader(dataView: DataView) {
    let header = dataView.getUint32(0, false);
    if (WavHeader.RIFF !== header) {
      throw new Error('Invalid WAV file');
    }

    dataView.getUint32(4, true);
    if (WavHeader.WAVE !== dataView.getUint32(8, false)) {
      throw new Error('Invalid WAV file');
    }
    if (WavHeader.fmt_ !== dataView.getUint32(12, false)) {
      throw new Error('Invalid WAV file');
    }
    const fmtLen = dataView.getUint32(16, true);
    let pos = 16 + 4;
    let channels = 0;
    let sampleRate = 0;
    switch (fmtLen) {
      case 16:
      case 18:
        channels = dataView.getUint16(pos + 2, true);
        sampleRate = dataView.getUint32(pos + 4, true);
        break;
      default:
        throw new Error('extended fmt chunk not implemented');
    }
    pos += fmtLen;
    let len = 0;
    while (WavHeader.data !== header) {
      header = dataView.getUint32(pos, false);
      len = dataView.getUint32(pos + 4, true);
      if (WavHeader.data === header) {
        break;
      }
      pos += len + 8;
    }

    return new WavHeader(pos + 8, len, channels, sampleRate);
  }
}
