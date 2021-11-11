import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountConfirmation = (): ReactElement => {
	const {
		goToPreviousStep,
		setupWizardData: { cloudRegistrationData },
	} = useSetupWizardContext();

	return (
		<AwaitingConfirmationPage
			emailAddress={cloudRegistrationData.cloudEmail}
			securityCode={cloudRegistrationData.intentData.user_code}
			onResendEmailRequest={() => undefined}
			onChangeEmailRequest={goToPreviousStep}
		/>
	);
};

export default CloudAccountConfirmation;
