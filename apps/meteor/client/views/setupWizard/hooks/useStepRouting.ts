import { useRouteParameter, useRouter, useRole, useSetting } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';

export const useStepRouting = (): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const router = useRouter();
	const hasAdminRole = useRole('admin');
	const hasOrganizationData = useSetting('Organization_Name') !== '';
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
		if ((currentStep === 1 || currentStep === 2) && hasOrganizationData) {
			setCurrentStep(3);
		}

		router.navigate(`/setup-wizard/${String(currentStep)}`);
	}, [router, currentStep, hasAdminRole, hasOrganizationData]);

	return [currentStep, setCurrentStep];
};
