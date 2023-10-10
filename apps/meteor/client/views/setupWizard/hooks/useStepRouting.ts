import { useRouteParameter, useRouter, useRole } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

export const useStepRouting = (): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const router = useRouter();
	const hasAdminRole = useRole('admin');
	const {
		setupWizardData: { organizationData },
	} = useSetupWizardContext();
	const hasOrganizationData = !!organizationData;
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
		if (hasOrganizationData) {
			setCurrentStep(3);
		}

		router.navigate(`/setup-wizard/${String(currentStep)}`);
	}, [router, currentStep, hasAdminRole, hasOrganizationData]);

	return [currentStep, setCurrentStep];
};
