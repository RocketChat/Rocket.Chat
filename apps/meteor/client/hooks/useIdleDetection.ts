import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

const event = new CustomEvent('idle');
const events = ['mousemove', 'mousedown', 'touchend', 'touchstart', 'keypress'];

export const useIdleDetection = (callback: () => void, { time = 3000, awayOnWindowBlur = false } = {}) => {
	const handleIdle1 = useEffectEvent(callback);

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
	}, [handleIdle1, time]);

	useEffect(() => {
		if (!awayOnWindowBlur) {
			return;
		}
		window.addEventListener('blur', handleIdle1);
		return () => {
			window.removeEventListener('blur', handleIdle1);
		};
	}, [awayOnWindowBlur, handleIdle1]);

	useEffect(() => {
		window.addEventListener('idle', handleIdle1);

		return () => {
			window.removeEventListener('idle', handleIdle1);
		};
	}, [handleIdle1]);
};
