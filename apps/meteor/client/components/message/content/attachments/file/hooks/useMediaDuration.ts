import { useEffect, useState } from 'react';

const durationCache = new Map<string, number>();

export const useMediaDuration = (src: string): number => {
	const [duration, setDuration] = useState(() => durationCache.get(src) ?? 0);

	useEffect(() => {
		const cached = src ? durationCache.get(src) : undefined;
		setDuration(cached ?? 0);

		if (!src || cached !== undefined) {
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
