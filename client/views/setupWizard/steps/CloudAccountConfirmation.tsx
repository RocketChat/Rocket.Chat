import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, useMemo } from 'react';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountConfirmation = (): ReactElement => {
	const {
		goToPreviousStep,
		registerServer,
		setupWizardData: { registrationData },
	} = useSetupWizardContext();

	const data = useEndpointData(
		'cloud.confirmationPoll',
		useMemo(
			() => ({
				deviceCode: registrationData.device_code,
			}),
			[registrationData.device_code],
		),
	);

	console.log(data);

	return (
		<AwaitingConfirmationPage
			emailAddress={registrationData.cloudEmail}
			securityCode={registrationData.user_code}
			onResendEmailRequest={(): Promise<void> =>
				registerServer({ email: registrationData.cloudEmail, resend: true })
			}
			onChangeEmailRequest={goToPreviousStep}
		/>
	);
};

export default CloudAccountConfirmation;
