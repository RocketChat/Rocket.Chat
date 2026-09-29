import { useEffect, useState } from 'react';

const SAMPLE_INTERVAL_MS = 80;

/**
 * How loud the stream is, from 0 to 1, sampled about twelve times a second; 0 without an audio track.
 *
 * Sublinear, so quiet signals — typical of remote audio after WebRTC decoding — still move a speaking indicator.
 */
export const useAudioLevel = (stream?: MediaStream | null): number => {
	const [level, setLevel] = useState(0);

	useEffect(() => {
		if (!stream) {
			setLevel(0);
			return;
		}
		// Guarded because callers hand over whatever they have: a preview stream, a stub in a test, an object that is
		// stream-shaped but not a MediaStream. A level indicator is not worth throwing over.
		if (typeof stream.getAudioTracks !== 'function') {
			setLevel(0);
			return;
		}

		const audioTracks = stream.getAudioTracks();
		if (!audioTracks.length) {
			setLevel(0);
			return;
		}

		const AC: typeof AudioContext | undefined =
			window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return;

		const ctx = new AC();
		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 512;
		analyser.smoothingTimeConstant = 0.3;
		source.connect(analyser);

		const buf = new Uint8Array(analyser.fftSize);
		let cancelled = false;
		let lastUpdate = 0;
		let rafId = 0;

		const tick = (ts: number) => {
			if (cancelled) return;
			if (ts - lastUpdate >= SAMPLE_INTERVAL_MS) {
				analyser.getByteTimeDomainData(buf);
				let sumSq = 0;
				for (let i = 0; i < buf.length; i++) {
					const v = (buf[i] - 128) / 128;
					sumSq += v * v;
				}
				const rms = Math.sqrt(sumSq / buf.length);
				setLevel(rms > 0 ? Math.min(1, Math.pow(rms, 0.65) * 2.5) : 0);
				lastUpdate = ts;
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);

		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			try {
				source.disconnect();
			} catch {
				// AudioNode may already be disconnected during teardown
			}
			void ctx.close().catch(() => undefined);
		};
	}, [stream]);

	return level;
};
