import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useRef, useState } from 'react';

const SAMPLE_INTERVAL_MS = 100;
const SPEAKING_THRESHOLD = 0.08;
const SUSTAINED_MS = 400;
/**
 * How long the answer holds after the last sample above the threshold: speech dips below any threshold between
 * words, and an answer that dropped on the first quiet sample would blink word by word. `SUSTAINED_MS` governs how
 * long it takes to start saying someone is talking; this only how long it keeps saying so once they pause.
 */
const RELEASE_MS = 3000;

const noop = () => undefined;

/** Whether the reader is talking into a muted microphone; `onFirstSpeech` is told once each time they are muted. */
export const useSpeakingWhileMuted = (muted: boolean, onFirstSpeech: () => void = noop): boolean => {
	const [speaking, setSpeaking] = useState(false);
	const onSpeech = useStableCallback(onFirstSpeech);
	const aboveThresholdSince = useRef<number | null>(null);
	const lastAboveThreshold = useRef<number | null>(null);

	useEffect(() => {
		if (!muted) {
			return undefined;
		}

		let cancelled = false;
		let told = false;
		let stream: MediaStream | undefined;
		let ctx: AudioContext | undefined;
		let timer: ReturnType<typeof setInterval> | undefined;

		void (async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			} catch {
				return;
			}
			if (cancelled) {
				stream.getTracks().forEach((t) => t.stop());
				return;
			}

			const AC: typeof AudioContext | undefined =
				window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AC) return;

			ctx = new AC();
			const source = ctx.createMediaStreamSource(stream);
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = 0.3;
			source.connect(analyser);

			const buf = new Uint8Array(analyser.fftSize);

			timer = setInterval(() => {
				if (cancelled) return;
				analyser.getByteTimeDomainData(buf);
				let sumSq = 0;
				for (let i = 0; i < buf.length; i++) {
					const v = (buf[i] - 128) / 128;
					sumSq += v * v;
				}
				const rms = Math.sqrt(sumSq / buf.length);
				const level = Math.min(1, rms * 4);

				const now = Date.now();
				if (level > SPEAKING_THRESHOLD) {
					lastAboveThreshold.current = now;
					if (aboveThresholdSince.current === null) {
						aboveThresholdSince.current = now;
					} else if (now - aboveThresholdSince.current >= SUSTAINED_MS) {
						setSpeaking(true);
						if (!told) {
							told = true;
							onSpeech();
						}
					}
					return;
				}

				// A pause, which is not the same as having stopped: the run of loud samples resets, but the answer
				// only turns over once the quiet has lasted `RELEASE_MS`.
				aboveThresholdSince.current = null;
				if (lastAboveThreshold.current === null || now - lastAboveThreshold.current >= RELEASE_MS) {
					setSpeaking(false);
				}
			}, SAMPLE_INTERVAL_MS);
		})();

		return () => {
			cancelled = true;
			if (timer !== undefined) clearInterval(timer);
			stream?.getTracks().forEach((t) => t.stop());
			void ctx?.close().catch(() => undefined);
			setSpeaking(false);
			aboveThresholdSince.current = null;
			lastAboveThreshold.current = null;
		};
	}, [muted, onSpeech]);

	return muted && speaking;
};
