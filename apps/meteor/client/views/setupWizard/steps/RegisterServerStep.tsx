import { RegisteredServerPage, StandaloneServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps, useState } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const SERVER_OPTIONS = {
	REGISTERED: 'REGISTERED',
	STANDALONE: 'STANDALONE',
};

const RegisterServerStep = (): ReactElement => {
	const {
		goToPreviousStep,
		currentStep,
		setSetupWizardData,
		setupWizardData: { adminData },
		registerServer,
		maxSteps,
		completeSetupWizard,
	} = useSetupWizardContext();
	const [serverOption, setServerOption] = useState(SERVER_OPTIONS.REGISTERED);

	const eventLoadedStats = useEndpointAction('POST', 'statistics.telemetry', {
		params: [{ eventName: 'setupWizardStats', stepName: 'RegisterServer', eventType: 'Loaded' }],
	});
	const eventCompletedStats = useEndpointAction('POST', 'statistics.telemetry', {
		params: [{ eventName: 'setupWizardStats', stepName: 'RegisterServer', eventType: 'Completed' }],
	});

	const handleRegister: ComponentProps<typeof RegisteredServerPage>['onSubmit'] = async (data) => {
		if (data.registerType !== 'standalone') {
			setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
			eventCompletedStats();
			await registerServer(data);
		}
	};

	const handleConfirmStandalone: ComponentProps<typeof StandaloneServerPage>['onSubmit'] = async ({ registerType }) => {
		if (registerType !== 'registered') {
			eventCompletedStats();
			return completeSetupWizard();
		}
	};

	eventLoadedStats();
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
		<RegisteredServerPage
			onClickContinue={(): void => setServerOption(SERVER_OPTIONS.STANDALONE)}
			onBackButtonClick={goToPreviousStep}
			stepCount={maxSteps}
			onSubmit={handleRegister}
			currentStep={currentStep}
			initialValues={{ email: adminData.email }}
		/>
	);
};

export default RegisterServerStep;
