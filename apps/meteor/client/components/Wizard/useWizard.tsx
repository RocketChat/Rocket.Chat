import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMemo, useState } from 'react';

import type { WizardAPI } from './WizardContext';
import type { StepMetadata, StepNode } from './lib/StepsLinkedList';
import { StepsLinkedList } from './lib/StepsLinkedList';

type UseWizardProps = {
	steps: StepMetadata[];
};

export const useWizard = ({ steps: stepsMetadata }: UseWizardProps) => {
	const [steps] = useState(new StepsLinkedList(stepsMetadata));
	const [currentStep, setCurrentStep] = useState<StepNode | null>(steps.head);

	const register = useEffectEvent((stepMetadata: StepMetadata) => {
		const step = steps.append(stepMetadata);
		return () => steps.remove(step.id);
	});

	const goTo = useEffectEvent(async (step: StepNode) => {
		if (step.disabled) {
			return;
		}

		setCurrentStep(step);
	});

	const next = useEffectEvent(async () => {
		if (!currentStep?.next) {
			return;
		}

		steps.enableStep(currentStep.next);
		goTo(currentStep.next);
	});

	const previous = useEffectEvent(async () => {
		if (!currentStep?.prev) {
			return;
		}

		steps.enableStep(currentStep.prev);
		goTo(currentStep.prev);
	});

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
