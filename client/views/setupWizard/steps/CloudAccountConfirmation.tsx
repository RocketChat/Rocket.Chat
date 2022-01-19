import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, useEffect, useCallback } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useSettingSetValue } from '../../../contexts/SettingsContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const setIntervalTime = (interval?: number): number => (interval ? interval * 1000 : 0);

const CloudAccountConfirmation = (): ReactElement => {
	const {
		registerServer,
		goToStep,
		setupWizardData: { registrationData },
		saveWorkspaceData,
	} = useSetupWizardContext();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const cloudConfirmationPoll = useEndpoint('GET', 'cloud.confirmationPoll');

	const getConfirmation = useCallback(async () => {
		try {
			const { pollData } = await cloudConfirmationPoll({
				deviceCode: registrationData.device_code,
			});

			if (pollData?.successful) {
				await saveWorkspaceData();
				return setShowSetupWizard('completed');
			}
		} catch (error) {
			console.log(error);
		}
	}, [cloudConfirmationPoll, registrationData.device_code, setShowSetupWizard, saveWorkspaceData]);

	useEffect(() => {
		setInterval(() => getConfirmation(), setIntervalTime(registrationData.interval));
	}, [getConfirmation, registrationData.interval]);

	return (
		<AwaitingConfirmationPage
			emailAddress={registrationData.cloudEmail}
			securityCode={registrationData.user_code}
			onResendEmailRequest={(): Promise<void> => registerServer({ email: registrationData.cloudEmail, resend: true })}
			onChangeEmailRequest={(): void => goToStep(3)}
		/>
	);
};

export default CloudAccountConfirmation;
