export type SampleRate =
  | 44100
  | 48000
  | 32000
  | 24000
  | 22050
  | 16000
  | 12000
  | 11025
  | 8000;

export function findNearestSampleRate(freq: number): SampleRate {
  if (freq <= 8000) return 8000;
  if (freq <= 11025) return 11025;
  if (freq <= 12000) return 12000;
  if (freq <= 16000) return 16000;
  if (freq <= 22050) return 22050;
  if (freq <= 24000) return 24000;
  if (freq <= 32000) return 32000;
  if (freq <= 44100) return 44100;

  return 48000;
}
