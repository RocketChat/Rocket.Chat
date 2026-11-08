import { useAudioLevel } from '@rocket.chat/ui-media';
import { useEffect, useRef, useState } from 'react';

import { speakingRingLevel } from '../lib/speakingRing';

/** How long the ring stays after speech stops, so it does not flicker between words. */
const SPEAKING_HOLD_MS = 1000;

/**
 * How loud a tile's microphone is right now, and how strongly its speaking ring shows. A muted microphone never
 * lights the ring, whatever residual signal it carries.
 */
export const useSpeakingRing = (audioStream: MediaStream | null, muted: boolean): { audioLevel: number; ringLevel: number } => {
	const audioLevel = useAudioLevel(muted ? null : audioStream);
	const activeLevel = speakingRingLevel(audioLevel);

	const [ringLevel, setRingLevel] = useState(0);
	const heldLevelRef = useRef(0);
	useEffect(() => {
		// Muting ends the speech outright; the hold is only for pauses between words.
		if (muted) {
			heldLevelRef.current = 0;
			setRingLevel(0);
			return;
		}
		if (activeLevel > 0) {
			heldLevelRef.current = activeLevel;
			setRingLevel(activeLevel);
			return;
		}
		if (heldLevelRef.current === 0) return;
		const handle = setTimeout(() => {
			heldLevelRef.current = 0;
			setRingLevel(0);
		}, SPEAKING_HOLD_MS);
		return () => clearTimeout(handle);
	}, [activeLevel, muted]);

	return { audioLevel, ringLevel };
};
