import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect, useCallback, useRef } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const setIntervalTime = (interval?: number): number => (interval ? interval * 1000 : 0);

const CloudAccountConfirmation = () => {
	const {
		registerServer,
		currentStep,
		maxSteps,
		goToStep,
		setupWizardData: { registrationData },
		completeCloudRegistration,
	} = useSetupWizardContext();
	const cloudConfirmationPoll = useEndpoint('GET', '/v1/cloud.confirmationPoll');
	const dispatchToastMessage = useToastMessageDispatch();
	const { i18n } = useTranslation();
	const isConfirming = useRef(false);

	const getConfirmation = useCallback(async () => {
		if (isConfirming.current || !registrationData.device_code) {
			return;
		}

		isConfirming.current = true;
		try {
			const { pollData } = await cloudConfirmationPoll({
				deviceCode: registrationData.device_code,
			});

			if ('successful' in pollData && pollData.successful) {
				await completeCloudRegistration();
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			isConfirming.current = false;
		}
	}, [cloudConfirmationPoll, registrationData.device_code, completeCloudRegistration, dispatchToastMessage]);

	useEffect(() => {
		const pollInterval = setInterval(() => getConfirmation(), setIntervalTime(registrationData.interval));

		return (): void => clearInterval(pollInterval);
	}, [getConfirmation, registrationData.interval]);

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
