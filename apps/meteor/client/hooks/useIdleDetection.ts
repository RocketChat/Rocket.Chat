import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

const event = new CustomEvent('idle');
const events = ['mousemove', 'mousedown', 'touchend', 'touchstart', 'keypress'];

export const useIdleDetection = (callback: () => void, { time = 3000, awayOnWindowBlur = false } = {}) => {
	const stableCallback = useEffectEvent(callback);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		const handleIdle = () => {
			interval = setTimeout(() => {
				document.dispatchEvent(event);
			}, time);
		};

		handleIdle();

		events.forEach((key) => document.addEventListener(key, handleIdle));
		return () => {
			clearTimeout(interval);
			events.forEach((key) => document.removeEventListener(key, handleIdle));
		};
	}, [stableCallback, time]);

	useEffect(() => {
		if (!awayOnWindowBlur) {
			return;
		}

		window.addEventListener('blur', stableCallback);
		return () => {
			window.removeEventListener('blur', stableCallback);
		};
	}, [awayOnWindowBlur, stableCallback]);

	useEffect(() => {
		window.addEventListener('idle', stableCallback);

		return () => {
			window.removeEventListener('idle', stableCallback);
		};
	}, [stableCallback]);
};
