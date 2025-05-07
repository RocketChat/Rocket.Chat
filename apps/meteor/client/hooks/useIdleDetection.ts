import { useEffect, useReducer } from 'react';

const events = ['mousemove', 'mousedown', 'touchend', 'touchstart', 'keypress'];

type UseIdleDetectionOptions = {
	id?: string;
	time?: number;
	awayOnWindowBlur?: boolean;
};

/**
 * A hook that detects when the user is idle.
 *
 * This hook listens for mousemove, mousedown, touchend, touchstart, and keypress events.
 * When any of these events are triggered, the user is considered active.
 * If no events are triggered for a specified period of time, the user is considered idle.
 *
 * @param {object} options - An object with the following properties:
 * @param {string} options.id - A unique identifier for the idle detection mechanism. Defaults to 'useIdleDetection'.
 * @param {number} options.time - The time in milliseconds to consider the user idle. Defaults to 600000 ms (10 minutes).
 * @param {boolean} options.awayOnWindowBlur - A boolean flag to trigger the idle state when the window loses focus. Defaults to false.
 *
 * @returns {boolean} A boolean indicating whether the user is idle or not.
 */

export const useIdleDetection = ({ id = 'useIdleDetection', time = 600000, awayOnWindowBlur = false }: UseIdleDetectionOptions = {}) => {
	const [isIdle, dispatch] = useReducer((state: boolean, action: boolean) => {
		if (state === action) {
			return state;
		}

		if (action) {
			document.dispatchEvent(new Event(`${id}_idle`));
		}

		if (!action) {
			document.dispatchEvent(new Event(`${id}_active`));
		}

		document.dispatchEvent(
			new CustomEvent(`${id}_change`, {
				detail: { isIdle: action },
			}),
		);

		return action;
	}, false);

	useEffect(() => {
		let interval: ReturnType<typeof setTimeout>;
		const handleIdle = () => {
			dispatch(false);
			clearTimeout(interval);
			interval = setTimeout(() => {
				dispatch(true);
			}, time);
		};

		handleIdle();

		events.forEach((key) => document.addEventListener(key, handleIdle));
		return () => {
			clearTimeout(interval);
			events.forEach((key) => document.removeEventListener(key, handleIdle));
		};
	}, [time]);

	useEffect(() => {
		if (!awayOnWindowBlur) {
			return;
		}

		const dispatchIdle = () => dispatch(true);
		window.addEventListener('blur', dispatchIdle);
		return () => {
			window.removeEventListener('blur', dispatchIdle);
		};
	}, [awayOnWindowBlur]);

	return isIdle;
};
