import { useEffect, useState } from 'react';

const SAMPLE_INTERVAL_MS = 80;

/**
 * Returns a normalised audio level (0–1) for the given MediaStream, derived
 * from a Web Audio AnalyserNode reading the time-domain RMS. Returns 0 when
 * the stream is null or has no audio tracks. Updates ~12Hz to keep render
 * pressure low while still feeling responsive for a speaking indicator.
 *
 * The raw RMS is boosted (×4, capped at 1) because conversational speech
 * RMS rarely exceeds ~0.25 — without the boost the UI barely lights up.
 */
export const useAudioLevel = (stream?: MediaStream | null): number => {
	const [level, setLevel] = useState(0);

	useEffect(() => {
		if (!stream) {
			setLevel(0);
			return;
		}
		const audioTracks = stream.getAudioTracks();
		if (!audioTracks.length) {
			setLevel(0);
			return;
		}

		const AC: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext;
		if (!AC) return;

		const ctx = new AC();
		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 512;
		analyser.smoothingTimeConstant = 0.5;
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
				setLevel(Math.min(1, rms * 4));
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
