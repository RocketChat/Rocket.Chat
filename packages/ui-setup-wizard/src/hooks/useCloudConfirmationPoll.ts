import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const setIntervalTime = (interval?: number): number => (interval ? interval * 1000 : 0);

/** Waits for the workspace to be confirmed in the cloud and finishes the wizard once it is. */
export const useCloudConfirmationPoll = () => {
	const {
		setupWizardData: { registrationData },
		saveWorkspaceData,
		completeSetupWizard,
	} = useSetupWizardContext();

	const cloudConfirmationPoll = useEndpoint('GET', '/v1/cloud.confirmationPoll');
	const dispatchToastMessage = useToastMessageDispatch();

	const getConfirmation = useCallback(async () => {
		try {
			if (!registrationData.device_code) {
				return;
			}

			const { pollData } = await cloudConfirmationPoll({ deviceCode: registrationData.device_code });

			if ('successful' in pollData && pollData.successful) {
				await saveWorkspaceData();
				await completeSetupWizard();
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [cloudConfirmationPoll, registrationData.device_code, saveWorkspaceData, completeSetupWizard, dispatchToastMessage]);

	useEffect(() => {
		const pollInterval = setInterval(() => getConfirmation(), setIntervalTime(registrationData.interval));

		return (): void => clearInterval(pollInterval);
	}, [getConfirmation, registrationData.interval]);
};
