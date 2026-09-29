import { useEffect, useRef } from 'react';

import { useAudioLevel } from './useAudioLevel';
import { AUTO_LOWER_AFTER_MS, decideAutoLower } from '../lib/autoLowerHand';

/** Drops the reader's raised hand once they have been speaking for a while: they have the floor. */
export const useAutoLowerHand = (handRaised: boolean, microphoneStream: MediaStream | undefined, lowerHand: () => void) => {
	const level = useAudioLevel(handRaised ? (microphoneStream ?? null) : null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSpeakingAtRef = useRef(0);

	useEffect(() => {
		const { countdown, lastSpeakingAt } = decideAutoLower({
			handRaised,
			level,
			now: Date.now(),
			counting: timerRef.current !== null,
			lastSpeakingAt: lastSpeakingAtRef.current,
		});
		lastSpeakingAtRef.current = lastSpeakingAt;

		if (countdown === 'start') {
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				lowerHand();
			}, AUTO_LOWER_AFTER_MS);
		}
		if (countdown === 'cancel' && timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, [level, handRaised, lowerHand]);

	// A countdown still running when the controls go away would lower a hand in a call this window has left.
	useEffect(
		() => () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		},
		[],
	);
};
