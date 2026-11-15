import { renderHook, act } from '@testing-library/react';

import type { StepMetadata } from './lib/StepNode';
import { useWizard } from './useWizard';

const initialSteps: StepMetadata[] = [
	{ id: 'step1', title: 'Step 1' },
	{ id: 'step2', title: 'Step 2' },
	{ id: 'step3', title: 'Step 3' },
];

describe('useWizard', () => {
	it('should initialize with the first step as the current step', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));
		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should navigate to the next step and enable it', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step2')?.disabled).toBe(true);

		act(() => result.current.next());

		expect(result.current.currentStep?.id).toBe('step2');
		expect(result.current.steps.get('step2')?.disabled).toBe(false);
	});

	it('should not navigate if there is no next step', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		act(() => result.current.next()); // To step2
		act(() => result.current.next()); // To step3

		expect(result.current.currentStep?.id).toBe('step3');

		act(() => result.current.next()); // Already at the end

		expect(result.current.currentStep?.id).toBe('step3');
	});

	it('should navigate to the previous step', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		act(() => result.current.next());

		expect(result.current.currentStep?.id).toBe('step2');

		act(() => result.current.previous());

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should not navigate if there is no previous step', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.currentStep?.id).toBe('step1');

		act(() => result.current.previous());

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should navigate to a specific step if it is enabled', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		act(() => {
			const step3 = result.current.steps.get('step3');
			if (step3) result.current.steps.enableStep(step3);
		});

		act(() => {
			const step3 = result.current.steps.get('step3');
			if (step3) result.current.goTo(step3);
		});

		expect(result.current.currentStep?.id).toBe('step3');
	});

	it('should not navigate to a specific step if it is disabled', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step3')?.disabled).toBe(true);

		act(() => {
			const step3 = result.current.steps.get('step3');
			if (step3) result.current.goTo(step3);
		});

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should disable all steps after the current one', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		// Enable all steps
		act(() => result.current.next());
		act(() => result.current.next());

		expect(result.current.steps.get('step2')?.disabled).toBe(false);
		expect(result.current.steps.get('step3')?.disabled).toBe(false);

		// Go back to step 1
		act(() => {
			const step1 = result.current.steps.get('step1');
			if (step1) result.current.goTo(step1);
		});

		// Reset
		act(() => result.current.resetNextSteps());

		expect(result.current.steps.get('step2')?.disabled).toBe(true);
		expect(result.current.steps.get('step3')?.disabled).toBe(true);
	});

	it('should register a new step and allow unregistering it', () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step4')).toBeNull();

		let unregister: () => void;
		act(() => {
			unregister = result.current.register({ id: 'step4', title: 'Step 4' });
		});

		expect(result.current.steps.get('step4')?.id).toBe('step4');

		act(() => unregister());

		expect(result.current.steps.get('step4')).toBeNull();
	});
});
