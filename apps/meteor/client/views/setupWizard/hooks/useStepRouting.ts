import { useRouteParameter, useRouter, useRole, useSetting } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';

export const useStepRouting = (): [number, Dispatch<SetStateAction<number>>] => {
	const param = useRouteParameter('step');
	const router = useRouter();
	const hasAdminRole = useRole('admin');
	const hasOrganizationData = !!useSetting('Organization_Name');

	const [currentStep, setCurrentStep] = useState<number>(() => {
		const initialStep = (() => {
			switch (true) {
				case hasOrganizationData: {
					return 3;
				}
				case hasAdminRole: {
					return 2;
				}
				default: {
					return 1;
				}
			}
		})();

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
		switch (true) {
			case (currentStep === 1 || currentStep === 2) && hasOrganizationData: {
				setCurrentStep(3);
				router.navigate(`/setup-wizard/3`);
				break;
			}

			case currentStep === 1 && hasAdminRole: {
				setCurrentStep(2);
				router.navigate(`/setup-wizard/2`);
				break;
			}

			default: {
				router.navigate(`/setup-wizard/${currentStep}`);
			}
		}
	}, [router, currentStep, hasAdminRole, hasOrganizationData]);

	return [currentStep, setCurrentStep];
};
