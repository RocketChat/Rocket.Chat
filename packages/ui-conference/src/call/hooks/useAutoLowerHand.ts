import { useAudioLevel } from '@rocket.chat/ui-media';
import { useCallback, useEffect, useRef } from 'react';

import { AUTO_LOWER_AFTER_MS, AUTO_LOWER_SPEAKING_THRESHOLD, SPEAKING_GAP_TOLERANCE_MS } from '../lib/autoLowerHand';

/**
 * Drops the reader's raised hand once they have been speaking for a while: they have the floor. A pause longer than a
 * gap between words starts the wait over.
 */
export const useAutoLowerHand = (handRaised: boolean, microphoneStream: MediaStream | undefined, lowerHand: () => void) => {
	const level = useAudioLevel(handRaised ? (microphoneStream ?? null) : null);
	const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancel = useCallback(() => {
		for (const ref of [countdownRef, silenceRef]) {
			if (ref.current) {
				clearTimeout(ref.current);
				ref.current = null;
			}
		}
	}, []);

	useEffect(() => {
		if (!handRaised) {
			cancel();
			return;
		}
		if (level <= AUTO_LOWER_SPEAKING_THRESHOLD) {
			return;
		}
		countdownRef.current ??= setTimeout(() => {
			cancel();
			lowerHand();
		}, AUTO_LOWER_AFTER_MS);
		if (silenceRef.current) {
			clearTimeout(silenceRef.current);
		}
		// The level only reports changes, and a steady silence is no change: the pause has to be timed, not sampled.
		silenceRef.current = setTimeout(cancel, SPEAKING_GAP_TOLERANCE_MS);
	}, [level, handRaised, lowerHand, cancel]);

	// A countdown still running when the controls go away would lower a hand in a call this window has left.
	useEffect(() => cancel, [cancel]);
};
