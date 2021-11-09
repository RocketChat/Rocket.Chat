import { CloudAccountEmailPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

type CloudAccountStepProps = {
	step: number;
	handleRegisterServer: () => void;
};

const CloudAccountStep = ({ step, handleRegisterServer }: CloudAccountStepProps): ReactElement => {
	const { goToPreviousStep } = useSetupWizardContext();

	return (
		<CloudAccountEmailPage
			currentStep={step}
			onBackButtonClick={goToPreviousStep}
			onSubmit={handleRegisterServer}
			stepCount={4}
		/>
	);
};

export default CloudAccountStep;
