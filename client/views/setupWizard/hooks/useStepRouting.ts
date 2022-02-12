import { useState, useEffect, Dispatch, SetStateAction } from 'react';

import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useUserId } from '../../../contexts/UserContext';

export const useStepRouting = (): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const userId = useUserId();
	const setupWizardRoute = useRoute('setup-wizard');

	const [currentStep, setCurrentStep] = useState<number>(() => {
		if (!param) {
			return 1;
		}

		const step = parseInt(param, 10);
		if (step && Number.isFinite(step) && step >= 1) {
			return step;
		}

		return 1;
	});

	useEffect(() => {
		// if (!userId) {
		// 	setCurrentStep(1);
		// } else if (currentStep === 1) {
		// 	setCurrentStep(2);
		// }

		setupWizardRoute.replace({ step: String(currentStep) });
	}, [setupWizardRoute, userId, currentStep]);

	return [currentStep, setCurrentStep];
};
