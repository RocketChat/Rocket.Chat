import { useEffect, useState } from 'react';

/**
 * Fetches the audio metadata off-DOM to know the track duration before it is
 * ever loaded into the shared player element.
 */
export const useAudioDuration = (src: string): number => {
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		setDuration(0);
		const audio = new Audio();
		audio.preload = 'metadata';

		const onDurationChange = () => {
			if (audio.duration === Infinity) {
				// Files recorded without a duration header (e.g. MediaRecorder) report
				// Infinity until the browser is forced to scan to the end.
				audio.currentTime = 1e101;
				return;
			}
			setDuration(audio.duration);
		};

		audio.addEventListener('durationchange', onDurationChange);
		audio.src = src;

		return () => {
			audio.removeEventListener('durationchange', onDurationChange);
			audio.removeAttribute('src');
			audio.load();
		};
	}, [src]);

	return duration;
};
