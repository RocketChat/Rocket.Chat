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

	it('should navigate to the next step and enable it', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step2')?.disabled).toBe(true);

		await act(() => result.current.next());

		expect(result.current.currentStep?.id).toBe('step2');
		expect(result.current.steps.get('step2')?.disabled).toBe(false);
	});

	it('should not navigate if there is no next step', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		await act(() => result.current.next()); // To step2
		await act(() => result.current.next()); // To step3

		expect(result.current.currentStep?.id).toBe('step3');

		await act(() => result.current.next()); // Already at the end

		expect(result.current.currentStep?.id).toBe('step3');
	});

	it('should navigate to the previous step', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		await act(() => result.current.next());

		expect(result.current.currentStep?.id).toBe('step2');

		await act(() => result.current.previous());

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should not navigate if there is no previous step', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.currentStep?.id).toBe('step1');

		await act(() => result.current.previous());

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should navigate to a specific step if it is enabled', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		await act(() => {
			const step3 = result.current.steps.get('step3');
			step3 && result.current.steps.enableStep(step3);
		});

		await act(() => {
			const step3 = result.current.steps.get('step3');
			step3 && result.current.goTo(step3);
		});

		expect(result.current.currentStep?.id).toBe('step3');
	});

	it('should not navigate to a specific step if it is disabled', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step3')?.disabled).toBe(true);

		await act(() => {
			const step3 = result.current.steps.get('step3');
			step3 && result.current.goTo(step3);
		});

		expect(result.current.currentStep?.id).toBe('step1');
	});

	it('should disable all steps after the current one', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		// Enable all steps
		await act(() => result.current.next());
		await act(() => result.current.next());

		expect(result.current.steps.get('step2')?.disabled).toBe(false);
		expect(result.current.steps.get('step3')?.disabled).toBe(false);

		// Go back to step 1
		await act(() => {
			const step1 = result.current.steps.get('step1');
			step1 && result.current.goTo(step1);
		});

		// Reset
		await act(() => result.current.resetNextSteps());

		expect(result.current.steps.get('step2')?.disabled).toBe(true);
		expect(result.current.steps.get('step3')?.disabled).toBe(true);
	});

	it('should register a new step and allow unregistering it', async () => {
		const { result } = renderHook(() => useWizard({ steps: initialSteps }));

		expect(result.current.steps.get('step4')).toBeNull();

		let unregister: () => void;
		await act(() => {
			unregister = result.current.register({ id: 'step4', title: 'Step 4' });
		});

		expect(result.current.steps.get('step4')?.id).toBe('step4');

		await act(() => unregister());

		expect(result.current.steps.get('step4')).toBeNull();
	});
});
