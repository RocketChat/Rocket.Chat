import { useRouteParameter, useRoute, useRole } from '@rocket.chat/ui-contexts';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export const useStepRouting = (): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const setupWizardRoute = useRoute('setup-wizard');
	const hasAdminRole = useRole('admin');
	const initialStep = hasAdminRole ? 2 : 1;

	const [currentStep, setCurrentStep] = useState<number>(() => {
		if (!param) {
			return initialStep;
		}

		const step = parseInt(param, 10);
		if (step && Number.isFinite(step) && step >= 1) {
			return step;
		}

		return initialStep;
	});

	useEffect(() => {
		if (hasAdminRole && currentStep === 1) {
			setCurrentStep(2);
		}

		setupWizardRoute.replace({ step: String(currentStep) });
	}, [setupWizardRoute, currentStep, hasAdminRole]);

	return [currentStep, setCurrentStep];
};
