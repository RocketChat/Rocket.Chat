import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountConfirmation = (): ReactElement => {
	const {
		goToPreviousStep,
		setupWizardData: { cloudRegistrationData },
	} = useSetupWizardContext();

	const data = useEndpointData(
		'cloud.confirmationPoll',
		useMemo(
			() => ({
				deviceCode: cloudRegistrationData.intentData.device_code,
			}),
			[cloudRegistrationData.intentData.device_code],
		),
	);

	console.log(data);

	return (
		<AwaitingConfirmationPage
			emailAddress={cloudRegistrationData.cloudEmail}
			securityCode={cloudRegistrationData.intentData?.user_code}
			onResendEmailRequest={() => undefined}
			onChangeEmailRequest={goToPreviousStep}
		/>
	);
};

export default CloudAccountConfirmation;
