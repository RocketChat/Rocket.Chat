import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMemo, useState } from 'react';

import type { WizardAPI } from './WizardContext';
import type { StepMetadata } from './lib/StepNode';
import type StepNode from './lib/StepNode';
import StepsLinkedList from './lib/StepsLinkedList';

type UseWizardProps = {
	steps: StepMetadata[];
};

/**
 * Custom hook to manage the state and navigation of a wizard.
 * It provides methods to register steps, navigate between them, and manage their state.
 *
 * @param {UseWizardProps} props - The properties for the wizard.
 * @returns {WizardAPI} The API for managing the wizard state and navigation.
 */
export const useWizard = ({ steps: stepsMetadata }: UseWizardProps) => {
	const [steps] = useState(new StepsLinkedList(stepsMetadata));
	const [currentStep, setCurrentStep] = useState<StepNode | null>(steps.head);

	/**
	 * Registers a new step in the wizard.
	 * If a step with the same ID already exists, it updates the existing step.
	 */
	const register = useEffectEvent((stepMetadata: StepMetadata) => {
		const step = steps.append(stepMetadata);
		return () => steps.remove(step.id);
	});

	/**
	 * Navigates to a specific step in the wizard.
	 * If the step is disabled, it does nothing.
	 *
	 * @param {StepNode} step - The step to navigate to.
	 */
	const goTo = useEffectEvent(async (step: StepNode) => {
		if (step.disabled) {
			return;
		}

		setCurrentStep(step);
	});

	/**
	 * Navigates to the next step in the wizard.
	 * If there is no next step, it does nothing.
	 */
	const next = useEffectEvent(async () => {
		if (!currentStep?.next) {
			return;
		}

		steps.enableStep(currentStep.next);
		goTo(currentStep.next);
	});

	/**
	 * Navigates to the previous step in the wizard.
	 * If there is no previous step, it does nothing.
	 */
	const previous = useEffectEvent(async () => {
		if (!currentStep?.prev) {
			return;
		}

		steps.enableStep(currentStep.prev);
		goTo(currentStep.prev);
	});

	/**
	 * Resets the next steps in the wizard.
	 * It disables all steps that come after the current step.
	 */
	const resetNextSteps = useEffectEvent(() => {
		if (!currentStep) {
			return;
		}

		let step = currentStep;
		while (step.next) {
			steps.disableStep(step.next);
			step = step.next;
		}
	});

	return useMemo<WizardAPI>(
		() => ({
			steps,
			register,
			currentStep,
			next,
			previous,
			goTo,
			resetNextSteps,
		}),
		[currentStep, goTo, next, previous, register, steps, resetNextSteps],
	);
};
