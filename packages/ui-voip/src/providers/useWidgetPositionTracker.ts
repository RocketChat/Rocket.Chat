import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useRef } from 'react';

export type LastKnownPosition = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const useWidgetPositionTracker = () => {
	const lastKnownPosition = useRef<LastKnownPosition | null>(null);

	const onChangePosition = useDebouncedCallback(
		(position: LastKnownPosition | null) => {
			lastKnownPosition.current = position;
		},
		500,
		[],
	);

	const getRestorePosition = useCallback(() => {
		return lastKnownPosition.current;
	}, []);

	return {
		onChangePosition,
		getRestorePosition,
	};
};

export default useWidgetPositionTracker;
