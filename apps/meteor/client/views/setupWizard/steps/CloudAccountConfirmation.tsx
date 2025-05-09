import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import { useToastMessageDispatch, useSettingSetValue, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useCallback } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const setIntervalTime = (interval?: number): number => (interval ? interval * 1000 : 0);

const CloudAccountConfirmation = (): ReactElement => {
	const {
		registerServer,
		currentStep,
		maxSteps,
		goToStep,
		setupWizardData: { registrationData },
		saveWorkspaceData,
	} = useSetupWizardContext();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const cloudConfirmationPoll = useEndpoint('GET', '/v1/cloud.confirmationPoll');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t, i18n } = useTranslation();

	const getConfirmation = useCallback(async () => {
		try {
			if (registrationData.device_code) {
				const { pollData } = await cloudConfirmationPoll({
					deviceCode: registrationData.device_code,
				});

				if ('successful' in pollData && pollData.successful) {
					await saveWorkspaceData();
					dispatchToastMessage({ type: 'success', message: t('Your_workspace_is_ready') });
					return setShowSetupWizard('completed');
				}
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [cloudConfirmationPoll, registrationData.device_code, setShowSetupWizard, saveWorkspaceData, dispatchToastMessage, t]);

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
