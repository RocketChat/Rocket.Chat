import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

import { useIdleDetection } from './useIdleDetection';

/**
 * useIdleActiveEvents is a custom hook that triggers a callback function when the user is detected to be idle, and another callback function when the user is detected to be active.
 * The idle state is determined based on the absence of certain user interactions for a specified time period.
 *
 * @param options - A configuration object.
 * @param options.id - A unique identifier for the idle detection mechanism.
 * @param options.time - The time in milliseconds to consider the user idle. Optional. Defaults to 600000 ms (10 minutes).
 * @param options.awayOnWindowBlur - A boolean flag to trigger the callback when the window loses focus. Optional. Defaults to false.
 * @param onIdleCallback - The callback function to be called when the user is detected to be idle.
 * @param onActiveCallback - The callback function to be called when the user is detected to be active.
 *
 */

export const useIdleActiveEvents = (
	{
		id,
		time,
		awayOnWindowBlur,
	}: {
		id: string;
		time?: number;
		awayOnWindowBlur?: boolean;
	},
	onIdleCallback: () => void,
	onActiveCallback?: () => void,
) => {
	const stableIdleCallback = useEffectEvent(onIdleCallback);
	const stableActiveCallback = useEffectEvent(onActiveCallback || (() => undefined));

	useEffect(() => {
		document.addEventListener(`${id}_idle`, stableIdleCallback);

		onActiveCallback && document.addEventListener(`${id}_active`, stableActiveCallback);

		return () => {
			document.removeEventListener(`${id}_idle`, stableIdleCallback);
			document.removeEventListener(`${id}_active`, stableActiveCallback);
		};
	}, [id, onActiveCallback, stableActiveCallback, stableIdleCallback]);

	return useIdleDetection({ id, time, awayOnWindowBlur });
};
