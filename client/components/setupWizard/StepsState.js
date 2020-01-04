import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useUserId } from '../../hooks/useUserId';
import { useRouteParameter, useRoute } from '../providers/RouterProvider';

const Context = createContext({});

export const useSetupWizardStepsState = () => useContext(Context);

export const finalStep = 'final';

const useStepRouting = () => {
	const param = useRouteParameter('step');
	const goToSetupWizard = useRoute('setup-wizard');

	const userId = useUserId();
	const [currentStep, setCurrentStep] = useState(() => {
		if (param === finalStep) {
			return finalStep;
		}

		const step = parseInt(param, 10);
		if (Number.isFinite(step) && step >= 1) {
			return step;
		}

		return 1;
	});

	useEffect(() => {
		if (!userId) {
			setCurrentStep(1);
		} else if (currentStep === 1) {
			setCurrentStep(2);
		}

		goToSetupWizard.replacingState({ step: String(currentStep) });
	}, [goToSetupWizard, userId, currentStep]);

	return [currentStep, setCurrentStep];
};

export function StepsState({ children }) {
	const [currentStep, setCurrentStep] = useStepRouting();

	const value = useMemo(() => ({
		currentStep,
		goToPreviousStep: () => setCurrentStep(currentStep - 1),
		goToNextStep: () => setCurrentStep(currentStep + 1),
		goToFinalStep: () => setCurrentStep(finalStep),
	}), [currentStep]);

	return <Context.Provider value={value}>
		{children}
	</Context.Provider>;
}
