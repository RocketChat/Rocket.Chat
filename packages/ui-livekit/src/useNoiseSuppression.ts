import type { MediaProcessorAssets } from '@rocket.chat/media-processors';
import { RnnoiseProcessor } from '@rocket.chat/media-processors';
import type { NoiseMethod } from '@rocket.chat/ui-conference';
import { useNoiseSuppressionPreference } from '@rocket.chat/ui-conference';
import type { LocalAudioTrack } from 'livekit-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The ways a microphone can be cleaned up, weakest first, which is the order a menu offers them in: untouched, the
 * browser's own `noiseSuppression` (steady hiss only), and RNNoise (transient noise too).
 */
const ORDER: NoiseMethod[] = ['none', 'browser', 'rnnoise'];

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
	assets: MediaProcessorAssets,
	processorRef: { current: RnnoiseProcessor | null },
	setMethod: (method: NoiseMethod) => void,
): Promise<void> => {
	try {
		const existing = processorRef.current;
		if (existing) {
			await existing.destroy().catch(() => undefined);
			await track.stopProcessor?.().catch(() => undefined);
			processorRef.current = null;
		}

		if (next === 'rnnoise') {
			const processor = new RnnoiseProcessor(assets);
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
 * A method is only offered once this browser has shown it can run it.
 */
export const useNoiseSuppression = (audioTrack: LocalAudioTrack | undefined, assets: MediaProcessorAssets) => {
	const { noiseMethod: preferred, selectNoiseMethod } = useNoiseSuppressionPreference();

	const processorRef = useRef<RnnoiseProcessor | null>(null);
	const trackRef = useRef<LocalAudioTrack | undefined>(audioTrack);
	trackRef.current = audioTrack;
	const assetsRef = useRef(assets);
	assetsRef.current = assets;

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

			if (cancelled) {
				return;
			}

			setMethods(ORDER.filter((candidate) => offered.includes(candidate)));

			// Whatever was chosen before, if it is still possible; otherwise the best on offer, which is what someone
			// who has never opened this menu wants.
			const remembered = preferredRef.current;
			const wanted = remembered && offered.includes(remembered) ? remembered : offered[offered.length - 1];

			await applyMethod(wanted, audioTrack, assetsRef.current, processorRef, setMethod);
		})();

		return () => {
			cancelled = true;
			const processor = processorRef.current;
			processorRef.current = null;
			setMethods([]);
			setMethod('none');
			if (processor) {
				void processor.destroy().catch(() => undefined);
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
			void applyMethod(next, track, assetsRef.current, processorRef, setMethod).finally(() => setPending(false));
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
