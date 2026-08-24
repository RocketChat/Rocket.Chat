import { useEffect, useRef, useState } from 'react';

const SAMPLE_INTERVAL_MS = 100;
const SPEAKING_THRESHOLD = 0.08;
const SUSTAINED_MS = 400;

export const useSpeakingWhileMuted = (muted: boolean): boolean => {
	const [speaking, setSpeaking] = useState(false);
	const aboveThresholdSince = useRef<number | null>(null);

	useEffect(() => {
		if (!muted) {
			setSpeaking(false);
			return undefined;
		}

		let cancelled = false;
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

			const AC: typeof AudioContext | undefined = (window as any).AudioContext || (window as any).webkitAudioContext;
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
					if (aboveThresholdSince.current === null) {
						aboveThresholdSince.current = now;
					} else if (now - aboveThresholdSince.current >= SUSTAINED_MS) {
						setSpeaking(true);
					}
				} else {
					aboveThresholdSince.current = null;
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
		};
	}, [muted]);

	return speaking;
};
