import { useCallback, useRef, useSyncExternalStore } from 'react';

import type StepNode from './lib/StepNode';
import type StepsLinkedList from './lib/StepsLinkedList';

/**
 * Custom hook to manage the state of wizard steps.
 * It uses a linked list to store the steps and provides a way to subscribe to changes.
 *
 * @param {StepsLinkedList} list - The linked list containing the steps.
 * @returns {StepNode[]} The current state of the steps.
 */
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
