import type { KrispNoiseFilterProcessor } from '@livekit/krisp-noise-filter';
import type { LocalAudioTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RnnoiseProcessor } from './rnnoiseProcessor';
import type { NoiseMethod } from '../../conference/hooks/useCallPreferences';
import { useNoiseSuppressionPreference } from '../../conference/hooks/useCallPreferences';

/**
 * The ways a microphone can be cleaned up, weakest first — which is the order a menu should offer them in, reading
 * from "leave it alone" up to the best this workspace can actually manage.
 *
 * - **none** — the microphone as it is.
 * - **browser** — the browser's own `noiseSuppression`. Free, everywhere, removes steady hiss and not much else.
 * - **rnnoise** — Xiph's RNNoise in an AudioWorklet, served from this workspace. Removes typing, chairs, the road
 *   outside. What Jitsi ships.
 * - **krisp** — the best of the three, licensed through LiveKit Cloud: on a self-hosted server its `setEnabled`
 *   answers 404, so it is only ever offered where it has been proven to work.
 */
const ORDER: NoiseMethod[] = ['none', 'browser', 'rnnoise', 'krisp'];

/**
 * Puts one method in circuit and takes whatever was there out.
 *
 * A processor and a constraint are different kinds of thing — one wraps the track, the other is a property of the
 * microphone — so moving between them means undoing the other. The browser's own goes through `restartTrack`, which
 * briefly interrupts the audio; that is the cost of it being a constraint.
 */
const applyMethod = async (
	next: NoiseMethod,
	track: LocalAudioTrack,
	processorRef: { current: KrispNoiseFilterProcessor | RnnoiseProcessor | null },
	setMethod: (method: NoiseMethod) => void,
): Promise<void> => {
	try {
		const existing = processorRef.current;
		if (existing) {
			await existing.destroy?.().catch(() => undefined);
			await track.stopProcessor?.().catch(() => undefined);
			processorRef.current = null;
		}

		if (next === 'krisp') {
			const { KrispNoiseFilter } = await import('@livekit/krisp-noise-filter');
			// eslint-disable-next-line new-cap
			const processor = KrispNoiseFilter();
			await track.setProcessor(processor);
			await processor.setEnabled(true);
			processorRef.current = processor;
			setMethod(processor.isEnabled() ? 'krisp' : 'none');
			return;
		}

		if (next === 'rnnoise') {
			const processor = new RnnoiseProcessor();
			await track.setProcessor(processor);
			processorRef.current = processor;
			setMethod('rnnoise');
			return;
		}

		// Both remaining answers are the same request with a different flag in it.
		await track.restartTrack({ noiseSuppression: next === 'browser', echoCancellation: true, autoGainControl: true });
		setMethod(next);
	} catch (err) {
		console.warn(`could not switch noise cancelling to ${next}`, err);
	}
};

/**
 * Noise cancelling on the local microphone: which methods this workspace can offer, which is running, and how to
 * change it.
 *
 * Every method is *proven* before being offered rather than taken from a support flag. Krisp especially: it reports
 * itself supported, attaches, starts its worklet, and only then fails an entitlement check — so offering it on the
 * strength of `isKrispNoiseFilterSupported()` would put a choice in the menu that quietly does nothing. Proving it
 * is also what starts it, so the cost is paid once either way.
 */
export const useNoiseSuppression = (audioTrack: LocalAudioTrack | undefined) => {
	const { noiseMethod: preferred, selectNoiseMethod } = useNoiseSuppressionPreference();

	const processorRef = useRef<KrispNoiseFilterProcessor | RnnoiseProcessor | null>(null);
	const trackRef = useRef<LocalAudioTrack | undefined>(audioTrack);
	trackRef.current = audioTrack;

	const [methods, setMethods] = useState<NoiseMethod[]>([]);
	const [method, setMethod] = useState<NoiseMethod>('none');
	const [pending, setPending] = useState(false);

	const preferredRef = useRef(preferred);
	preferredRef.current = preferred;

	useEffect(() => {
		if (!audioTrack) {
			setMethods([]);
			setMethod('none');
			return;
		}

		let cancelled = false;

		void (async () => {
			// `none` and `browser` need nothing but a track, so both are possible by the time we are here.
			const offered: NoiseMethod[] = ['none', 'browser'];

			if (await RnnoiseProcessor.isSupported()) {
				offered.push('rnnoise');
			}

			let krisp: KrispNoiseFilterProcessor | null = null;
			try {
				const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import('@livekit/krisp-noise-filter');
				if (isKrispNoiseFilterSupported() && !cancelled) {
					// eslint-disable-next-line new-cap
					const candidate = KrispNoiseFilter();
					await audioTrack.setProcessor(candidate);
					await candidate.setEnabled(true);
					if (candidate.isEnabled()) {
						krisp = candidate;
						offered.push('krisp');
					} else {
						await candidate.destroy().catch(() => undefined);
						await audioTrack.stopProcessor?.().catch(() => undefined);
					}
				}
			} catch (err) {
				console.info('krisp noise cancelling is not available to this workspace', err);
				await audioTrack.stopProcessor?.().catch(() => undefined);
			}

			if (cancelled) {
				await krisp?.destroy().catch(() => undefined);
				return;
			}

			setMethods(ORDER.filter((candidate) => offered.includes(candidate)));

			// Whatever was chosen before, if it is still possible; otherwise the best on offer, which is what someone
			// who has never opened this menu wants.
			const remembered = preferredRef.current;
			const wanted = remembered && offered.includes(remembered) ? remembered : offered[offered.length - 1];

			if (krisp) {
				processorRef.current = krisp;
				setMethod('krisp');
			}

			if (!krisp || wanted !== 'krisp') {
				await applyMethod(wanted, audioTrack, processorRef, setMethod);
			}
		})();

		return () => {
			cancelled = true;
			const processor = processorRef.current;
			processorRef.current = null;
			setMethods([]);
			setMethod('none');
			if (processor) {
				void processor.destroy?.().catch(() => undefined);
				void audioTrack.stopProcessor?.().catch(() => undefined);
			}
		};
	}, [audioTrack]);

	const select = useCallback(
		(next: NoiseMethod) => {
			const track = trackRef.current;
			if (!track || pending || next === method) {
				return;
			}

			selectNoiseMethod(next);
			setPending(true);
			void applyMethod(next, track, processorRef, setMethod).finally(() => setPending(false));
		},
		[method, pending, selectNoiseMethod],
	);

	return useMemo(
		() => ({
			/** Which methods this workspace can actually offer, weakest first. Empty until there is a track. */
			methods,
			/** The one running. */
			method,
			/** True while a change is being made, since starting a filter is not instant. */
			pending,
			select,
		}),
		[methods, method, pending, select],
	);
};
