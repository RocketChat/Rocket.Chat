import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

const events = ['mousemove', 'mousedown', 'touchend', 'touchstart', 'keypress'];

/**
 * useIdleDetection is a custom hook that triggers a callback function when the user is detected to be idle.
 * The idle state is determined based on the absence of certain user interactions for a specified time period.
 *
 * @param callback - The callback function to be called when the user is detected to be idle.
 * @param options - An optional configuration object.
 * @param options.time - The time in milliseconds to consider the user idle. Defaults to 600000 ms (10 minutes).
 * @param options.awayOnWindowBlur - A boolean flag to trigger the callback when the window loses focus. Defaults to false.
 *
 */

export const useIdleDetection = (callback: () => void, { time = 600000, awayOnWindowBlur = false } = {}) => {
	const stableCallback = useEffectEvent(callback);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		const handleIdle = () => {
			clearTimeout(interval);
			interval = setTimeout(() => {
				document.dispatchEvent(new Event('idle'));
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
		document.addEventListener('idle', stableCallback);

		return () => {
			document.removeEventListener('idle', stableCallback);
		};
	}, [stableCallback]);
};
