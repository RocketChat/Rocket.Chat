import { useMemo, useState } from 'react';

export type CreateRoomStep = 'details' | 'attributes' | 'security' | 'preview';

export const useCreateRoomSteps = (isStepped: boolean, isAbacManaged: boolean) => {
	const steps = useMemo<CreateRoomStep[]>(() => {
		if (!isStepped) {
			return ['details'];
		}

		return isAbacManaged ? ['details', 'attributes', 'security', 'preview'] : ['details', 'security'];
	}, [isStepped, isAbacManaged]);

	const [requestedIndex, setIndex] = useState(0);
	const index = Math.min(requestedIndex, steps.length - 1);

	return {
		step: steps[index],
		index,
		total: steps.length,
		isLast: index === steps.length - 1,
		next: () => setIndex(index + 1),
		back: () => setIndex(Math.max(index - 1, 0)),
	};
};
