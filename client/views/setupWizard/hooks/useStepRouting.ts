import { useState, useEffect } from 'react';

import { useRouteParameter, useRoute } from '../../../contexts/RouterContext';
import { useUserId } from '../../../contexts/UserContext';

export const FINAL_STEP = 'FINAL';

export const useStepRouting = () => {
	const param = useRouteParameter('step');
	const userId = useUserId();
	const setupWizardRoute = useRoute('setup-wizard');

	const [currentStep, setCurrentStep] = useState(() => {
		if (param === FINAL_STEP) {
			return FINAL_STEP;
		}

		const step = parseInt(param, 10);
		if (Number.isFinite(step) && step >= 1) {
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
