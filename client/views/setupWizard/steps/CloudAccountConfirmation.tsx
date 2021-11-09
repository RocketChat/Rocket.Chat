import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountConfirmation = (): ReactElement => {
	const {
		goToPreviousStep,
		setupWizardData: { cloudRegistrationData },
	} = useSetupWizardContext();
	console.log(cloudRegistrationData);

	return (
		<AwaitingConfirmationPage
			emailAddress='test@mail.com'
			securityCode={cloudRegistrationData.user_code}
			onResendEmailRequest={() => undefined}
			onChangeEmailRequest={goToPreviousStep}
		/>
	);
};

export default CloudAccountConfirmation;
