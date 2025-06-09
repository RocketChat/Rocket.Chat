import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect, useRef } from 'react';

const events = ['mousemove', 'mousedown', 'touchend', 'touchstart', 'keypress'];

export type UseIdleDetectionOptions = {
	id?: string;
	time?: number;
	awayOnWindowBlur?: boolean;
};

export const DEFAULT_IDLE_DETECTION_OPTIONS = Object.freeze({
	id: 'useIdleDetection',
	time: 600_000, // 10 minutes
	awayOnWindowBlur: false,
});

/**
 * A hook that detects when the user is idle.
 *
 * This hook listens for mousemove, mousedown, touchend, touchstart, and keypress events.
 * When any of these events are triggered, the user is considered active.
 * If no events are triggered for a specified period of time, the user is considered idle.
 *
 * @param options - An object with the following properties:
 * @param options.id - A unique identifier for the idle detection mechanism. Defaults to 'useIdleDetection'.
 * @param options.time - The time in milliseconds to consider the user idle. Defaults to 600000 ms (10 minutes).
 * @param options.awayOnWindowBlur - A boolean flag to trigger the idle state when the window loses focus. Defaults to false.
 */
export const useIdleDetection = ({
	id = DEFAULT_IDLE_DETECTION_OPTIONS.id,
	time = DEFAULT_IDLE_DETECTION_OPTIONS.time,
	awayOnWindowBlur = DEFAULT_IDLE_DETECTION_OPTIONS.awayOnWindowBlur,
}: UseIdleDetectionOptions = {}) => {
	const idleRef = useRef(false);

	const dispatchIdle = useEffectEvent(() => {
		if (idleRef.current) return;

		document.dispatchEvent(new Event(`${id}_idle`));
		document.dispatchEvent(
			new CustomEvent(`${id}_change`, {
				detail: { isIdle: true },
			}),
		);
		idleRef.current = true;
	});

	const dispatchActive = useEffectEvent(() => {
		if (!idleRef.current) return;

		document.dispatchEvent(new Event(`${id}_active`));
		document.dispatchEvent(
			new CustomEvent(`${id}_change`, {
				detail: { isIdle: false },
			}),
		);
		idleRef.current = false;
	});

	useEffect(() => {
		let interval: ReturnType<typeof setTimeout>;
		const handleIdle = () => {
			dispatchActive();
			clearTimeout(interval);
			interval = setTimeout(() => {
				dispatchIdle();
			}, time);
		};

		handleIdle();

		events.forEach((key) => document.addEventListener(key, handleIdle));
		return () => {
			clearTimeout(interval);
			events.forEach((key) => document.removeEventListener(key, handleIdle));
		};
	}, [dispatchActive, dispatchIdle, time]);

	useEffect(() => {
		if (!awayOnWindowBlur) {
			return;
		}

		window.addEventListener('blur', dispatchIdle);
		return () => {
			window.removeEventListener('blur', dispatchIdle);
		};
	}, [awayOnWindowBlur, dispatchIdle]);
};
