import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { Mp3Encoder } from './Mp3Encoder';
import { WavHeader } from './WavHeader';

let leftSampleBuffer: ArrayBufferLike;
let rightSampleBuffer: ArrayBufferLike;

beforeAll(async () => {
  const leftPath = join('testdata', 'Left44100.wav');
  const rightPath = join('testdata', 'Right44100.wav');

  leftSampleBuffer = new Uint8Array(await readFile(leftPath)).buffer;
  rightSampleBuffer = new Uint8Array(await readFile(rightPath)).buffer;
});

test('mono', async () => {
  const waveHeader = WavHeader.readHeader(new DataView(leftSampleBuffer));
  const samples = new Int16Array(
    leftSampleBuffer,
    waveHeader.dataOffset,
    waveHeader.dataLen / 2,
  );

  const hash = createHash('sha1');
  hash.setEncoding('hex');

  let remainingSamples = samples.length;

  const encoder = new Mp3Encoder();
  const maxSamples = 1152;

  for (let i = 0; remainingSamples >= maxSamples; i += maxSamples) {
    const left = samples.subarray(i, i + maxSamples);
    const right = samples.subarray(i, i + maxSamples);

    const mp3buf = encoder.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
      hash.write(Buffer.from(mp3buf));
    }
    remainingSamples -= maxSamples;
  }

  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    hash.write(Buffer.from(mp3buf));
  }

  hash.end();

  expect(hash.read()).toBe('ca9292fc5fea3ba4cb07c4a0ba60cf0c267b783b');
});

test('stereo', async () => {
  const leftWaveHeader = WavHeader.readHeader(new DataView(leftSampleBuffer));
  const rightWaveHeader = WavHeader.readHeader(new DataView(rightSampleBuffer));

  expect(leftWaveHeader.sampleRate).toBe(rightWaveHeader.sampleRate);

  const leftSamples = new Int16Array(
    leftSampleBuffer,
    leftWaveHeader.dataOffset,
    leftWaveHeader.dataLen / 2,
  );
  const rightSamples = new Int16Array(
    rightSampleBuffer,
    rightWaveHeader.dataOffset,
    rightWaveHeader.dataLen / 2,
  );

  expect(leftSamples.length).toBe(rightSamples.length);

  const hash = createHash('sha1');
  hash.setEncoding('hex');

  let remainingSamples = leftSamples.length;

  const encoder = new Mp3Encoder(2, leftWaveHeader.sampleRate, 128);
  const maxSamples = 1152;

  for (let i = 0; remainingSamples >= maxSamples; i += maxSamples) {
    const left = leftSamples.subarray(i, i + maxSamples);
    const right = rightSamples.subarray(i, i + maxSamples);

    const mp3buf = encoder.encodeBuffer(left, right);
    if (mp3buf.length > 0) {
      hash.write(Buffer.from(mp3buf));
    }
    remainingSamples -= maxSamples;
  }

  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    hash.write(Buffer.from(mp3buf));
  }

  hash.end();

  expect(hash.read()).toBe('ab6daeb1c563389cafacc0ec4ed963ee8ae8e8d7');
});
