export type Bitrate =
  | 8
  | 16
  | 24
  | 32
  | 40
  | 48
  | 56
  | 64
  | 80
  | 96
  | 112
  | 128
  | 144
  | 160
  | 192
  | 224
  | 256
  | 320;

const bitratesMap = {
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1],
  mpeg2_5: [0, 8, 16, 24, 32, 40, 48, 56, 64, -1, -1, -1, -1, -1, -1, -1],
} as const satisfies Record<string, readonly (Bitrate | 0 | -1)[]>;

const LOW_SAMPLE_RATE_THRESHOLD = 16000;

const getBitrates = (
  version: 0 | 1,
  samplerate = LOW_SAMPLE_RATE_THRESHOLD,
) => {
  if (samplerate < 16000) {
    return bitratesMap.mpeg2_5;
  }

  if (version === 0) {
    return bitratesMap.mpeg2;
  }

  return bitratesMap.mpeg1;
};

export function findNearestBitrate(
  bRate: number,
  version: 0 | 1,
  samplerate: number,
): Bitrate {
  const bitrates = getBitrates(version, samplerate);

  let matchingBitrate: Bitrate = bitrates[1];

  for (let i = 2; i <= 14; i++) {
    const bitrate = bitrates[i];
    if (bitrate !== 0 && bitrate !== -1) {
      if (Math.abs(bitrate - bRate) < Math.abs(matchingBitrate - bRate)) {
        matchingBitrate = bitrate;
      }
    }
  }
  return matchingBitrate;
}

export type BitrateIndex = number & { __brand: 'BitrateIndex' };

export function findBitrateIndex(
  bRate: number,
  version: 0 | 1,
  samplerate: number,
): BitrateIndex {
  const bitrates = getBitrates(version, samplerate);

  for (let i = 1; i <= 14; i++) {
    const bitrate = bitrates[i];
    if (bitrate > 0) {
      if (bitrate === bRate) {
        return i as BitrateIndex;
      }
    }
  }

  throw new Error(`Invalid bitrate ${bRate}`);
}

export function getBitrate(version: 0 | 1, index: number): Bitrate | 0 | -1 {
  const bitrates = getBitrates(version);
  return bitrates[index];
}
