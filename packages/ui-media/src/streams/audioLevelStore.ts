const SAMPLE_INTERVAL_MS = 80;

type Meter = { level: number; listeners: Set<() => void>; stop: () => void };

const meters = new WeakMap<MediaStream, Meter>();

const getAudioContextClass = (): typeof AudioContext | undefined =>
	window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

/** Sublinear, so quiet signals — typical of remote audio after WebRTC decoding — still move a speaking indicator. */
const levelOf = (samples: Uint8Array): number => {
	let sumSq = 0;
	for (let i = 0; i < samples.length; i++) {
		const v = (samples[i] - 128) / 128;
		sumSq += v * v;
	}
	const rms = Math.sqrt(sumSq / samples.length);
	return rms > 0 ? Math.min(1, Math.pow(rms, 0.65) * 2.5) : 0;
};

const startMeter = (stream: MediaStream, ctx: AudioContext): Meter => {
	const source = ctx.createMediaStreamSource(stream);
	const analyser = ctx.createAnalyser();
	analyser.fftSize = 512;
	analyser.smoothingTimeConstant = 0.3;
	source.connect(analyser);

	const buf = new Uint8Array(analyser.fftSize);
	let lastUpdate = 0;
	let rafId = 0;
	let stopped = false;

	// A context made before the reader has interacted with the page starts suspended, and measures nothing until
	// resumed — which the browser only allows from an interaction.
	const resume = () => {
		if (ctx.state === 'suspended') {
			void ctx.resume().catch(() => undefined);
		}
	};
	resume();
	document.addEventListener('pointerdown', resume, true);
	document.addEventListener('keydown', resume, true);

	const meter: Meter = {
		level: 0,
		listeners: new Set(),
		stop: () => {
			stopped = true;
			cancelAnimationFrame(rafId);
			document.removeEventListener('pointerdown', resume, true);
			document.removeEventListener('keydown', resume, true);
			try {
				source.disconnect();
			} catch {
				// AudioNode may already be disconnected during teardown
			}
			void ctx.close().catch(() => undefined);
		},
	};

	const tick = (ts: number) => {
		if (ts - lastUpdate >= SAMPLE_INTERVAL_MS) {
			analyser.getByteTimeDomainData(buf);
			const level = levelOf(buf);
			lastUpdate = ts;
			if (level !== meter.level) {
				meter.level = level;
				meter.listeners.forEach((listener) => listener());
			}
		}
		// A listener above may have been the last to leave, stopping the meter mid-tick.
		if (!stopped) {
			rafId = requestAnimationFrame(tick);
		}
	};
	rafId = requestAnimationFrame(tick);

	return meter;
};

/** Measures the stream with one analyser, however many readers it has, for as long as it has any. */
export const subscribeToAudioLevel = (stream: MediaStream, listener: () => void): (() => void) => {
	const AC = getAudioContextClass();
	if (!AC) {
		return () => undefined;
	}

	let meter = meters.get(stream);
	if (!meter) {
		const ctx = new AC();
		try {
			meter = startMeter(stream, ctx);
		} catch {
			// Something stream-shaped that is not a MediaStream; a level indicator is not worth throwing over.
			void ctx.close().catch(() => undefined);
			return () => undefined;
		}
		meters.set(stream, meter);
	}
	const current = meter;
	current.listeners.add(listener);

	return () => {
		current.listeners.delete(listener);
		if (!current.listeners.size) {
			current.stop();
			meters.delete(stream);
		}
	};
};

/** How loud the stream is, from 0 to 1, while someone is subscribed to it; 0 otherwise. */
export const getAudioLevel = (stream: MediaStream): number => meters.get(stream)?.level ?? 0;
