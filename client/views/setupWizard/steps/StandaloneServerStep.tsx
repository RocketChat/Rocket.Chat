import { StandaloneServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountStep = (): ReactElement => {
	const { goToPreviousStep, currentStep, completeSetupWizard, maxSteps } = useSetupWizardContext();

	const handleConfirmStandalone: ComponentProps<typeof StandaloneServerPage>['onSubmit'] = async ({ registerType }) => {
		if (registerType !== 'registered') {
			return completeSetupWizard();
		}
	};

	return (
		<StandaloneServerPage
			currentStep={currentStep}
			onBackButtonClick={goToPreviousStep}
			onSubmit={handleConfirmStandalone}
			stepCount={maxSteps}
		/>
	);
};

export default CloudAccountStep;
