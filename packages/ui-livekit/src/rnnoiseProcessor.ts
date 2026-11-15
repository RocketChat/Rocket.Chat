import type { RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor';
import type { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';

/** The only rate RNNoise was trained at; at any other its bands land on the wrong frequencies. */
const RNNOISE_SAMPLE_RATE = 48_000;

/** How long to wait for the browser to let audio run before giving up on this device's filter. */
const RESUME_TIMEOUT_MS = 500;

const wasmBinaries = new Map<string, Promise<ArrayBuffer>>();

/** Fetched once per page, since every restart of the microphone would otherwise download it again. */
const loadWasm = (baseUrl: string): Promise<ArrayBuffer> => {
	let binary = wasmBinaries.get(baseUrl);
	if (!binary) {
		binary = import('@sapphi-red/web-noise-suppressor').then(({ loadRnnoise }) =>
			loadRnnoise({ url: `${baseUrl}/rnnoise.wasm`, simdUrl: `${baseUrl}/rnnoise_simd.wasm` }),
		);
		binary.catch(() => wasmBinaries.delete(baseUrl));
		wasmBinaries.set(baseUrl, binary);
	}
	return binary;
};

const waitUntilRunning = async (context: AudioContext): Promise<void> => {
	await Promise.race([context.resume(), new Promise((resolve) => setTimeout(resolve, RESUME_TIMEOUT_MS))]);
	if (context.state !== 'running') {
		throw new Error('The browser did not let the noise filter run');
	}
};

/**
 * Noise suppression with RNNoise, which removes the transient noise (typing, chairs, traffic) the browser's own filter
 * leaves in. It runs in an AudioWorklet, so main-thread work cannot make the audio drop out.
 *
 * It fails rather than send silence: a context the browser keeps suspended, or one this browser cannot feed a
 * microphone into, would publish a track with nothing on it.
 */
export class RnnoiseProcessor implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
	readonly name = 'rnnoise';

	processedTrack?: MediaStreamTrack;

	// Its own context rather than the room's, which runs at whatever rate the output device does.
	private context?: AudioContext;

	private worklet?: RnnoiseWorkletNode;

	constructor(private readonly baseUrl: string) {}

	async init({ track }: AudioProcessorOptions): Promise<void> {
		const { RnnoiseWorkletNode } = await import('@sapphi-red/web-noise-suppressor');

		const context = new AudioContext({ sampleRate: RNNOISE_SAMPLE_RATE, latencyHint: 'interactive' });
		this.context = context;

		try {
			await waitUntilRunning(context);
			const [wasmBinary] = await Promise.all([
				loadWasm(this.baseUrl),
				context.audioWorklet.addModule(`${this.baseUrl}/rnnoise-worklet.js`),
			]);

			const source = context.createMediaStreamSource(new MediaStream([track]));
			this.worklet = new RnnoiseWorkletNode(context, { maxChannels: 1, wasmBinary });
			const destination = context.createMediaStreamDestination();
			source.connect(this.worklet).connect(destination);
			// A context the system suspends mid-call (the device taken by another app, the machine sleeping) would leave
			// the call silent.
			context.onstatechange = () => {
				if (context.state === 'suspended') {
					void context.resume().catch(() => undefined);
				}
			};

			this.processedTrack = destination.stream.getAudioTracks()[0];
		} catch (err) {
			await this.destroy();
			throw err;
		}
	}

	async restart(opts: AudioProcessorOptions): Promise<void> {
		await this.destroy();
		await this.init(opts);
	}

	async destroy(): Promise<void> {
		this.worklet?.destroy();
		this.worklet = undefined;
		this.processedTrack = undefined;

		const { context } = this;
		this.context = undefined;
		await context?.close().catch(() => undefined);
	}
}
