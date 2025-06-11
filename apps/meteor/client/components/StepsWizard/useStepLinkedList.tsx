import { useCallback, useRef, useSyncExternalStore } from 'react';

import type { StepNode, StepsLinkedList } from './StepsLinkedList';
import type { StepsWizardStep } from './StepsWizardContext';

export const useStepLinkedList = (list: StepsLinkedList<StepsWizardStep>) => {
	const stateRef = useRef<StepNode<StepsWizardStep>[]>([]);

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
