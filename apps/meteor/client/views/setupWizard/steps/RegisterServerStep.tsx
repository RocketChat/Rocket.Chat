import { RegisterServerPage, RegisterOfflinePage } from '@rocket.chat/onboarding-ui';
import type { ReactElement, ComponentProps } from 'react';
import React, { useState } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const SERVER_OPTIONS = {
	REGISTERED: 'REGISTERED',
	OFFLINE: 'OFFLINE',
};

const RegisterServerStep = (): ReactElement => {
	const { goToPreviousStep, currentStep, goToNextStep, goToStep, setSetupWizardData, registerServer, maxSteps, offline } =
		useSetupWizardContext();
	const [serverOption, setServerOption] = useState(SERVER_OPTIONS.REGISTERED);

	const handleRegister: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async (data: { email: string; resend?: boolean }) => {
		goToNextStep();
		setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
		await registerServer(data);
	};

	const handleConfirmOffline: ComponentProps<typeof RegisterOfflinePage>['onSubmit'] = async (/* data: unknown*/) => {
		// TODO: CALL REGISTER WITH TOKEN
		return goToStep(4);
	};

	if (serverOption === SERVER_OPTIONS.OFFLINE) {
		return (
			<RegisterOfflinePage onBackButtonClick={(): void => setServerOption(SERVER_OPTIONS.REGISTERED)} onSubmit={handleConfirmOffline} />
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
