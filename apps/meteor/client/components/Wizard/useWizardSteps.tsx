import { useCallback, useRef, useSyncExternalStore } from 'react';

import type { StepNode, StepsLinkedList } from './lib/StepsLinkedList';

export const useWizardSteps = (list: StepsLinkedList) => {
	const stateRef = useRef<StepNode[]>([]);

	const getSnapshot = useCallback(() => stateRef.current, []);

	const subscribe = useCallback(
		(onStoreChange: () => void) => {
			stateRef.current = list.toArray();

			return list.on('stateChanged', (): void => {
				stateRef.current = list.toArray();
				onStoreChange();
			});
		},
		[list],
	);

	return useSyncExternalStore(subscribe, getSnapshot);
};
