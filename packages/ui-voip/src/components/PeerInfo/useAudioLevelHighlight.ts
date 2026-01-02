import { Palette } from '@rocket.chat/fuselage';
import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

import { useMediaCallContext } from '../../context';

const strokeHighlight = Palette.stroke['stroke-highlight'];

const getOpacity = (audioLevel: number) => {
	if (audioLevel < 30) {
		return 0;
	}

	// if (audioLevel >= 70) {
	// 	return 100;
	// }

	return Math.max(50, audioLevel);
};

// const getBoxShadow = (audioLevel: number) => `0px 0px 1px 2px rgba(${strokeHighlight.toString()}, ${getOpacity(audioLevel)})`;
const getBoxShadow = (audioLevel: number) =>
	`0px 0px 1px 2px color-mix(in srgb, ${strokeHighlight.toString()}, transparent ${getOpacity(audioLevel)}%)`;

const AUDIO_LEVEL_POLL_INTERVAL = 100;

function getMeterLevel(audioLevel: number) {
	// A sensible minimum dB level for "silence" in the UI
	const minDB = -60.0;
	// The maximum dB level for "full scale"
	const maxDB = 0.0;

	if (audioLevel < 0.001) {
		return 0.0;
	}

	// Convert linear audio level to dBFS
	const db = 20 * Math.log10(audioLevel);

	// Clamp the dB value to our desired range
	const clampedDb = Math.max(minDB, Math.min(db, maxDB));

	// Normalize the clamped dB value to a 0.0-1.0 range
	const normalizedLevel = (clampedDb - minDB) / (maxDB - minDB);

	// Convert to a 0-100 range
	return Math.floor(normalizedLevel * 100);
}

const pollAudioLevel = (getAudioLevel: () => number, callback: (audioLevel: number) => void) => {
	const interval = setInterval(() => {
		const audioLevel = getMeterLevel(getAudioLevel());
		// console.log('audioLevel', audioLevel);
		callback(audioLevel);
	}, AUDIO_LEVEL_POLL_INTERVAL);

	return () => {
		clearInterval(interval);
	};
};

export const useAudioLevelHighlight = () => {
	const { getAudioLevel } = useMediaCallContext();

	return useSafeRefCallback(
		useCallback(
			(node) => {
				const stopPolling = pollAudioLevel(getAudioLevel, (audioLevel) => {
					console.log('audioLevel', audioLevel);
					console.log('getBoxShadow', getBoxShadow(audioLevel));
					node.style.boxShadow = getBoxShadow(audioLevel);
				});

				return () => {
					stopPolling();
					node.style.boxShadow = 'none';
				};
			},
			[getAudioLevel],
		),
	);
};
