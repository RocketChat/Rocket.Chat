import { RegisterServerPage, RegisterOfflinePage } from '@rocket.chat/onboarding-ui';
import { useEndpoint, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useEffect, useState } from 'react';

import { queryClient } from '../../../lib/queryClient';
import { dispatchToastMessage } from '../../../lib/toast';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const SERVER_OPTIONS = {
	REGISTERED: 'REGISTERED',
	OFFLINE: 'OFFLINE',
};

const RegisterServerStep = (): ReactElement => {
	const t = useTranslation();
	const { goToPreviousStep, currentStep, goToNextStep, completeSetupWizard, setSetupWizardData, registerServer, maxSteps, offline } =
		useSetupWizardContext();
	const [serverOption, setServerOption] = useState(SERVER_OPTIONS.REGISTERED);

	const handleRegister: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async (data: { email: string; resend?: boolean }) => {
		goToNextStep();
		setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
		await registerServer(data);
	};

	const [clientKey, setClientKey] = useState('');

	const registerManually = useEndpoint('POST', '/v1/cloud.manualRegister');
	const getWorkspaceRegisterData = useMethod('cloud:getWorkspaceRegisterData');

	useEffect(() => {
		const loadWorkspaceRegisterData = async (): Promise<void> => {
			const clientKey = await getWorkspaceRegisterData();
			setClientKey(clientKey);
		};

		loadWorkspaceRegisterData();
	}, [getWorkspaceRegisterData]);

	const handleConfirmOffline: ComponentProps<typeof RegisterOfflinePage>['onSubmit'] = async ({ token }) => {
		try {
			await registerManually({ cloudBlob: token });
			queryClient.invalidateQueries(['licenses']);

			return completeSetupWizard();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Cloud_register_error') });
		}
	};

	if (serverOption === SERVER_OPTIONS.OFFLINE) {
		return (
			<RegisterOfflinePage
				clientKey={clientKey}
				onBackButtonClick={(): void => setServerOption(SERVER_OPTIONS.REGISTERED)}
				onSubmit={handleConfirmOffline}
			/>
		);
	}

	return (
		<RegisterServerPage
			onClickRegisterOffline={(): void => setServerOption(SERVER_OPTIONS.OFFLINE)}
			onBackButtonClick={goToPreviousStep}
			stepCount={maxSteps}
			onSubmit={handleRegister}
			currentStep={currentStep}
			offline={offline}
		/>
	);
};

export default RegisterServerStep;
