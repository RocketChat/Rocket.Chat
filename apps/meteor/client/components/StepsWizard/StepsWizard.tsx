import { Box, Button, ButtonGroup, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMutation } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

// import { StepsWizardContent } from './StepsWizardContent';
import type { StepNode } from './StepsLinkedList';
import { StepsLinkedList } from './StepsLinkedList';
import type { StepsWizardStep } from './StepsWizardContext';
import { StepsWizardContext } from './StepsWizardContext';
import { useStepLinkedList } from './useStepLinkedList';

function runValidations(step: StepNode<StepsWizardStep> | null, validSteps: string[] = []): Promise<string[]> {
	if (!step) {
		return Promise.resolve(validSteps);
	}

	return Promise.resolve(step.value.validate?.() ?? true).then((isValidStep) => {
		if (isValidStep) {
			validSteps.push(step.value.id);
			return runValidations(step.next, validSteps);
		}

		return validSteps;
	});
}

const StepsWizard = ({ children }: { children: ReactNode }) => {
	const [steps] = useState(new StepsLinkedList<StepsWizardStep>());
	const list = useStepLinkedList(steps);

	const [currentStep, setCurrentStep] = useState<StepNode<StepsWizardStep> | null>(null);

	const { data: validSteps = [], mutateAsync: validateSteps } = useMutation({
		mutationFn: () => runValidations(steps.head),
	});

	const isValidStep = async (stepId: string) => {
		const validSteps = await validateSteps();
		return validSteps.includes(stepId);
	};

	const registerStep = useEffectEvent((step: StepsWizardStep) => {
		steps.append(step);

		if (steps.size === 1) {
			setCurrentStep(steps.get(step.id));
		}

		void validateSteps();

		return () => steps.remove(step.id);
	});

	const handleGoToStep = async (step: StepNode<StepsWizardStep>) => {
		if (!(await isValidStep(step.value.id))) {
			return;
		}

		setCurrentStep(step);
	};

	const handleNextStep = async () => {
		if (!currentStep) {
			return;
		}

		if (!currentStep.next) {
			return;
		}

		if (!(await isValidStep(currentStep.next.value.id))) {
			return;
		}

		await currentStep.value.onNext?.();

		setCurrentStep(currentStep.next);
	};

	const handlePreviousStep = async () => {
		if (!currentStep) {
			return;
		}

		if (!currentStep.prev) {
			return;
		}

		if (!(await isValidStep(currentStep.prev.value.id))) {
			return;
		}

		await currentStep.value.onBack?.();

		setCurrentStep(currentStep.prev);
	};

	const contextValue = useMemo(
		() => ({
			registerStep,
			currentStep: currentStep?.value.id ?? null,
		}),
		[registerStep, currentStep],
	);

	return (
		<StepsWizardContext.Provider value={contextValue}>
			<div className='steps-wizard'>
				<Tabs>
					{list.map((step, index) => (
						<TabsItem
							key={index}
							selected={currentStep?.value.id === step.value.id}
							disabled={!validSteps.includes(step.value.id)}
							onClick={validSteps.includes(step.value.id) ? () => handleGoToStep(step) : undefined}
						>
							{index + 1}. {step.value.title}
						</TabsItem>
					))}
				</Tabs>
				<div className='steps-wizard-content'>{children}</div>
				<Box className='steps-wizard-footer' pb={24} display='flex' justifyContent='end'>
					<ButtonGroup>
						{currentStep?.prev ? <Button onClick={() => handlePreviousStep()}>Back</Button> : null}
						{currentStep?.next ? <Button onClick={() => handleNextStep()}>Next</Button> : null}
					</ButtonGroup>
				</Box>
			</div>
		</StepsWizardContext.Provider>
	);
};

export default StepsWizard;
