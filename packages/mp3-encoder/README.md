# `@rocket.chat/mp3-encoder`

> A LAME-based MP3 encoder that runs as a web worker.

[![npm](https://img.shields.io/npm/v/@rocket.chat/mp3-encoder?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/mp3-encoder) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/mp3-encoder?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/mp3-encoder)

This package is a web worker script that encodes raw audio samples into an MP3 stream. It is a TypeScript port of the LAME encoder, so it needs no native code or WebAssembly. Rocket.Chat uses it to encode voice messages recorded in the browser.

The package has no exports. You load its built file as a worker and talk to it with `postMessage`.

## Installation

```sh
npm install @rocket.chat/mp3-encoder
```

There are no dependencies. The worker script is published in two builds: `dist/index.js` (a classic script, suitable for `new Worker(url)`) and `dist/index.mjs` (an ES module).

## Usage

### Serving the worker

Copy or link `node_modules/@rocket.chat/mp3-encoder/dist/index.js` to a path your app serves as a static file, then start a worker from it:

```ts
const worker = new Worker('/workers/mp3-encoder/index.js');
```

### Encoding audio

The worker understands three commands:

1. `init` sets up a new encoder.
2. `encode` sends a chunk of samples. Send as many as you need.
3. `finish` flushes the encoder. The worker answers with an `end` message holding the encoded MP3.

```ts
const worker = new Worker('/workers/mp3-encoder/index.js');

worker.onmessage = (event: MessageEvent) => {
	if (event.data.command === 'end') {
		const mp3 = new Blob(event.data.buffer, { type: 'audio/mpeg' });
		worker.terminate();
		// upload or play `mp3`
	}
};

worker.postMessage({
	command: 'init',
	config: { sampleRate: 48000, bitRate: 32 },
});

// For each chunk of mono audio, e.g. from an AudioWorklet or ScriptProcessorNode:
worker.postMessage({ command: 'encode', buffer: samples }); // Float32Array in [-1, 1]

// When recording stops:
worker.postMessage({ command: 'finish' });
```

The encoded output does not depend on how you split the samples into chunks. After `finish`, send `init` again to start a new stream.

## API

### Messages to the worker

| Message                                                                 | Description                                                                                                                               |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `{ command: 'init', config?: { numChannels?, sampleRate?, bitRate? } }` | Creates the encoder. Defaults: `numChannels` 1, `sampleRate` 44100 (Hz), `bitRate` 32 (kbps). `sampleRate` must match the audio you send. |
| `{ command: 'encode', buffer: Float32Array }`                           | Encodes a chunk of samples. Values are clamped to [-1, 1] and converted to 16-bit PCM.                                                    |
| `{ command: 'finish' }`                                                 | Flushes the encoder and posts the result.                                                                                                 |

### Messages from the worker

| Message                                   | Description                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `{ command: 'end', buffer: Int8Array[] }` | The MP3 stream as a list of chunks, in order. Pass the list to `new Blob()` to get a single file. |

### Mono only

Each `encode` message is treated as a single channel. Mix multi-channel audio down to one channel before sending it.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/mp3-encoder). From the repository root:

```sh
yarn workspace @rocket.chat/mp3-encoder build
yarn workspace @rocket.chat/mp3-encoder start
yarn workspace @rocket.chat/mp3-encoder testunit
yarn workspace @rocket.chat/mp3-encoder lint
yarn workspace @rocket.chat/mp3-encoder lint:fix
yarn workspace @rocket.chat/mp3-encoder typecheck
```

`build` bundles the worker with Rollup; `start` rebuilds on change. The tests encode the WAV files in `testdata/` and compare the result with a known hash, so a change to the encoder that alters its output fails them.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
