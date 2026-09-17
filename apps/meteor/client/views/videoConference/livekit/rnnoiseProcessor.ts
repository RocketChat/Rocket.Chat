import type { AudioProcessorOptions, Track, TrackProcessor } from 'livekit-client';

/** Where the worklet and the WASM are served from. See `apps/meteor/public/noise-suppressor`. */
const ASSETS = '/noise-suppressor';

/**
 * Noise suppression with RNNoise, for workspaces that cannot have Krisp.
 *
 * RNNoise is a small recurrent network (about 85KB of weights) that Xiph built for exactly this, and it is what
 * Jitsi ships. It is not as good as Krisp on the hardest noise, and it is a great deal better than the browser's
 * own: the browser suppresses steady hiss, while this one removes typing, chairs, and the road outside.
 *
 * It runs in an **AudioWorklet**, on the audio thread, which is the only place a per-frame filter belongs — doing
 * it on the main thread would mean audio dropping out whenever React re-rendered. The graph is the simplest thing
 * that works: the microphone in, the worklet, and a destination whose track is what gets published.
 *
 * Its assets are served from `public/` rather than a CDN. That is deliberate: this exists for the deployments that
 * cannot reach Krisp's licensing server, and many of those cannot reach a CDN either.
 */
export class RnnoiseProcessor implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> {
	readonly name = 'rnnoise-noise-filter';

	processedTrack?: MediaStreamTrack;

	/** Only set when we made it ourselves, which is the only case where closing it is ours to do. */
	private ownContext?: AudioContext;

	private source?: MediaStreamAudioSourceNode;

	private worklet?: AudioWorkletNode;

	private destination?: MediaStreamAudioDestinationNode;

	/** Whether the filter is in circuit. Switched rather than rebuilt, since rebuilding cuts the audio. */
	private enabled = true;

	static async isSupported(): Promise<boolean> {
		return typeof AudioWorkletNode !== 'undefined' && typeof WebAssembly !== 'undefined';
	}

	async init(opts: AudioProcessorOptions): Promise<void> {
		const { loadRnnoise, RnnoiseWorkletNode } = await import('@sapphi-red/web-noise-suppressor');

		// The processor's own context where LiveKit hands one over, so the filter lives in the same clock as the
		// rest of the call's audio.
		const context = opts.audioContext ?? new AudioContext();
		if (!opts.audioContext) {
			this.ownContext = context;
		}

		const [wasmBinary] = await Promise.all([
			loadRnnoise({ url: `${ASSETS}/rnnoise.wasm`, simdUrl: `${ASSETS}/rnnoise_simd.wasm` }),
			context.audioWorklet.addModule(`${ASSETS}/rnnoise-worklet.js`),
		]);

		this.source = context.createMediaStreamSource(new MediaStream([opts.track]));

		this.worklet = new RnnoiseWorkletNode(context, { maxChannels: 1, wasmBinary });
		this.destination = context.createMediaStreamDestination();

		this.connect();
		this.processedTrack = this.destination.stream.getAudioTracks()[0];
	}

	async restart(opts: AudioProcessorOptions): Promise<void> {
		await this.destroy();
		await this.init(opts);
	}

	/**
	 * Switches the filter in or out by rewiring, leaving everything loaded.
	 *
	 * The published track never changes, so nothing renegotiates and the far side hears no gap — the same reason
	 * Krisp is switched rather than detached.
	 */
	async setEnabled(enabled: boolean): Promise<boolean> {
		if (enabled === this.enabled) {
			return this.enabled;
		}

		this.enabled = enabled;
		this.disconnect();
		this.connect();

		return this.enabled;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	async destroy(): Promise<void> {
		this.disconnect();
		this.worklet?.port.close();
		this.worklet = undefined;
		this.source = undefined;
		this.destination = undefined;
		this.processedTrack = undefined;

		// Only a context of our own making: one LiveKit lent us belongs to the call, and closing it would take the
		// call's audio with it.
		const own = this.ownContext;
		this.ownContext = undefined;
		await own?.close().catch(() => undefined);
	}

	private connect(): void {
		if (!this.source || !this.destination) {
			return;
		}

		if (this.enabled && this.worklet) {
			this.source.connect(this.worklet).connect(this.destination);
			return;
		}

		// Straight through, so "off" is the microphone untouched rather than the microphone silenced.
		this.source.connect(this.destination);
	}

	private disconnect(): void {
		this.source?.disconnect();
		this.worklet?.disconnect();
	}
}
