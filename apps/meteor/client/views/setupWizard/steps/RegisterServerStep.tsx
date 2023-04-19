import { RegisterServerPage, StandaloneServerPage } from '@rocket.chat/onboarding-ui';
import { useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useState } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const SERVER_OPTIONS = {
	REGISTERED: 'REGISTERED',
	STANDALONE: 'STANDALONE',
};

const RegisterServerStep = (): ReactElement => {
	const { goToPreviousStep, currentStep, setSetupWizardData, registerServer, maxSteps, offline, completeSetupWizard } =
		useSetupWizardContext();
	const [serverOption, setServerOption] = useState(SERVER_OPTIONS.REGISTERED);

	const router = useRoute('cloud');

	const handleRegisterOffline: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async () => {
		await completeSetupWizard();
		router.push({}, { register: 'true' });
	};

	const handleRegister: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async (data) => {
		if (data.registerType !== 'standalone') {
			setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
			await registerServer(data);
		}
	};

	const handleConfirmStandalone: ComponentProps<typeof StandaloneServerPage>['onSubmit'] = async ({ registerType }) => {
		if (registerType !== 'registered') {
			return completeSetupWizard();
		}
	};

	if (serverOption === SERVER_OPTIONS.STANDALONE) {
		return (
			<StandaloneServerPage
				currentStep={currentStep}
				onBackButtonClick={(): void => setServerOption(SERVER_OPTIONS.REGISTERED)}
				onSubmit={handleConfirmStandalone}
				stepCount={maxSteps}
			/>
		);
	}

	return (
		<RegisterServerPage
			onClickRegisterLater={(): void => setServerOption(SERVER_OPTIONS.STANDALONE)}
			onBackButtonClick={goToPreviousStep}
			stepCount={maxSteps}
			onSubmit={offline ? handleRegisterOffline : handleRegister}
			currentStep={currentStep}
			offline={offline}
		/>
	);
};

export default RegisterServerStep;
