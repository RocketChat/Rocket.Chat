import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';

export type LastKnownPosition = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const useWidgetPositionTracker = () => {
	const [lastKnownPosition, setLastKnownPosition] = useState<LastKnownPosition | null>(null);

	const onChangePosition = useDebouncedCallback(setLastKnownPosition, 500, []);

	return {
		onChangePosition,
		lastKnownPosition,
	};
};

export default useWidgetPositionTracker;
