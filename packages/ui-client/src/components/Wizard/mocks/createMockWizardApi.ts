import type { WizardAPI } from '../WizardContext';
import StepsLinkedList from '../lib/StepsLinkedList';

export const createMockWizardApi = (overrides?: Partial<WizardAPI>) => {
	const steps = new StepsLinkedList([
		{ id: 'test-step-1', title: 'Test Step 1' },
		{ id: 'test-step-2', title: 'Test Step 2' },
		{ id: 'test-step-3', title: 'Test Step 3' },
	]);

	return {
		steps,
		currentStep: steps.head?.next ?? null,
		next: jest.fn(),
		previous: jest.fn(),
		register: jest.fn(),
		goTo: jest.fn(),
		resetNextSteps: jest.fn(),
		...overrides,
	};
};
