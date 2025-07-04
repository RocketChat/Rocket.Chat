import { renderHook, act } from '@testing-library/react';

import type { StepMetadata } from './lib/StepNode';
import StepsLinkedList from './lib/StepsLinkedList';
import { useWizardSteps } from './useWizardSteps';

describe('useWizardSteps', () => {
	it('should return the initial array of steps from the list', () => {
		const initialSteps: StepMetadata[] = [{ id: '1', title: 'Step 1' }];
		const list = new StepsLinkedList(initialSteps);

		const { result } = renderHook(() => useWizardSteps(list));

		expect(result.current).toEqual(list.toArray());
	});

	it('should update the steps when the list emits a stateChanged event', () => {
		const initialSteps: StepMetadata[] = [{ id: '1', title: 'Step 1' }];
		const list = new StepsLinkedList(initialSteps);

		const { result } = renderHook(() => useWizardSteps(list));

		expect(result.current).toEqual(list.toArray());

		act(() => list.append({ id: '2', title: 'Step 2' }));

		expect(result.current).toEqual(list.toArray());
	});

	it('should subscribe to list changes on mount and unsubscribe on unmount', () => {
		const list = new StepsLinkedList([]);
		const onSpy = jest.spyOn(list, 'on');
		const offSpy = jest.spyOn(list, 'off');

		const { unmount } = renderHook(() => useWizardSteps(list));

		expect(onSpy).toHaveBeenCalledWith('stateChanged', expect.any(Function));

		unmount();

		expect(offSpy).toHaveBeenCalledWith('stateChanged', expect.any(Function));
	});

	it('should return the latest state on re-render if the list instance changes', () => {
		const initialSteps1: StepMetadata[] = [{ id: '1', title: 'Step 1' }];
		const list1 = new StepsLinkedList(initialSteps1);

		const { result, rerender } = renderHook(({ list }) => useWizardSteps(list), {
			initialProps: { list: list1 },
		});

		expect(result.current).toEqual(list1.toArray());

		const initialSteps2: StepMetadata[] = [
			{ id: 'a', title: 'Step A' },
			{ id: 'b', title: 'Step B' },
		];
		const list2 = new StepsLinkedList(initialSteps2);

		rerender({ list: list2 });

		expect(result.current).toEqual(list2.toArray());
	});
});
