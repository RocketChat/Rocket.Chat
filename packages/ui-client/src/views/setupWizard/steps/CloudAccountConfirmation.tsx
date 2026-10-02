import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';
import { useCloudConfirmationPoll } from '../hooks/useCloudConfirmationPoll';

const CloudAccountConfirmation = () => {
	const { i18n } = useTranslation();

	const {
		registerServer,
		currentStep,
		maxSteps,
		goToStep,
		setupWizardData: { registrationData },
	} = useSetupWizardContext();

	useCloudConfirmationPoll();

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<AwaitingConfirmationPage
				currentStep={currentStep}
				stepCount={maxSteps}
				emailAddress={registrationData.cloudEmail}
				securityCode={registrationData.user_code}
				onResendEmailRequest={(): Promise<void> => registerServer({ email: registrationData.cloudEmail, resend: true })}
				onChangeEmailRequest={(): void => goToStep(3)}
			/>
		</I18nextProvider>
	);
};

export default CloudAccountConfirmation;
