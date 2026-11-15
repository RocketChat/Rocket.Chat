import { useEffect, useRef, useState } from 'react';

const SAMPLE_INTERVAL_MS = 80;
const SPEAKING_THRESHOLD = 0.2;
// How long a speaker holds the "active" slot after they stop, to avoid
// flickering between speakers during natural conversation pauses.
const HOLD_MS = 1500;

/**
 * Tracks the dominant speaker across all participants by sampling audio levels
 * from a single shared AudioContext. Returns the participant id that is speaking
 * the loudest (above threshold), with hysteresis to avoid flicker.
 *
 * Falls back to `fallbackId` when nobody is speaking.
 */
export const useActiveSpeakerId = (
	participants: ReadonlyArray<{ id: string; audioStream?: MediaStream | null }>,
	fallbackId: string | null,
): string | null => {
	const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

	// Stable identity for the participant list so the effect only re-runs when
	// the actual set of (id, stream) pairs changes — not on every render.
	const participantsKey = participants
		.map((p) => `${p.id}:${p.audioStream?.id ?? 'none'}`)
		.sort()
		.join(',');

	const holdRef = useRef<{ id: string | null; heardAt: number }>({ id: null, heardAt: 0 });

	useEffect(() => {
		const AC: typeof AudioContext | undefined =
			window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return undefined;

		const ctx = new AC();

		// A context made before the reader has interacted with the page starts suspended, and measures nothing until
		// resumed — which the browser only allows from an interaction.
		const resume = () => {
			if (ctx.state === 'suspended') {
				void ctx.resume().catch(() => undefined);
			}
		};
		const sources: Array<{ id: string; source: MediaStreamAudioSourceNode; analyser: AnalyserNode }> = [];

		for (const p of participants) {
			if (!p.audioStream || typeof p.audioStream.getAudioTracks !== 'function') continue;
			const tracks = p.audioStream.getAudioTracks();
			if (!tracks.length) continue;

			const source = ctx.createMediaStreamSource(p.audioStream);
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = 0.3;
			source.connect(analyser);
			sources.push({ id: p.id, source, analyser });
		}

		if (sources.length === 0) {
			setActiveSpeakerId(null);
			return () => void ctx.close().catch(() => undefined);
		}

		resume();
		document.addEventListener('pointerdown', resume, true);
		document.addEventListener('keydown', resume, true);

		const buf = new Uint8Array(512);
		let cancelled = false;
		let rafId = 0;
		let lastUpdate = 0;

		const tick = (ts: number) => {
			if (cancelled) return;
			if (ts - lastUpdate >= SAMPLE_INTERVAL_MS) {
				let maxLevel = 0;
				let maxId: string | null = null;

				for (const { id, analyser } of sources) {
					analyser.getByteTimeDomainData(buf);
					let sumSq = 0;
					for (let i = 0; i < buf.length; i++) {
						const v = (buf[i] - 128) / 128;
						sumSq += v * v;
					}
					const rms = Math.sqrt(sumSq / buf.length);
					const level = rms > 0 ? Math.min(1, Math.pow(rms, 0.65) * 2.5) : 0;
					if (level > maxLevel && level > SPEAKING_THRESHOLD) {
						maxLevel = level;
						maxId = id;
					}
				}

				const now = Date.now();
				const hold = holdRef.current;

				if (maxId && maxId === hold.id) {
					hold.heardAt = now;
				} else if (maxId && (!hold.id || now - hold.heardAt > HOLD_MS)) {
					hold.id = maxId;
					hold.heardAt = now;
					setActiveSpeakerId(maxId);
				} else if (!maxId && hold.id && now - hold.heardAt > HOLD_MS) {
					hold.id = null;
					setActiveSpeakerId(null);
				}

				lastUpdate = ts;
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);

		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			document.removeEventListener('pointerdown', resume, true);
			document.removeEventListener('keydown', resume, true);
			for (const { source } of sources) {
				try {
					source.disconnect();
				} catch {
					// may already be disconnected
				}
			}
			void ctx.close().catch(() => undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [participantsKey]);

	return activeSpeakerId ?? fallbackId;
};
