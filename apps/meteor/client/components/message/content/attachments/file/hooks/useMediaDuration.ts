import { useEffect, useState } from 'react';

const durationCache = new Map<string, number>();

export const useMediaDuration = (src: string): number => {
	const [duration, setDuration] = useState(() => durationCache.get(src) ?? 0);

	useEffect(() => {
		if (!src) {
			return;
		}

		const cached = durationCache.get(src);
		if (cached !== undefined) {
			setDuration(cached);
			return;
		}

		const audio = new Audio();
		audio.preload = 'metadata';

		const handleDuration = () => {
			if (Number.isFinite(audio.duration) && audio.duration > 0) {
				durationCache.set(src, audio.duration);
				setDuration(audio.duration);
			}
		};

		audio.addEventListener('loadedmetadata', handleDuration);
		audio.addEventListener('durationchange', handleDuration);
		audio.src = src;
		audio.load();

		return () => {
			audio.removeEventListener('loadedmetadata', handleDuration);
			audio.removeEventListener('durationchange', handleDuration);
			audio.removeAttribute('src');
			audio.load();
		};
	}, [src]);

	return duration;
};
