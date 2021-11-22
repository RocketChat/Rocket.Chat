import { CloudAccountEmailPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

// import { useEndpoint } from '../../../contexts/ServerContext';
// import { useSettingSetValue } from '../../../contexts/SettingsContext';
// import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
// import { useUserId } from '../../../contexts/UserContext';
// import type { HandleRegisterServer } from '../SetupWizardPage';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountStep = (): ReactElement => {
	const {
		goToPreviousStep,
		currentStep,
		// setSetupWizardData,
		// registerAdminUser,
		// goToNextStep,
		registerServer,
		validateEmail,
	} = useSetupWizardContext();

	// const dispatchToastMessage = useToastMessageDispatch();
	// const createRegistrationIntent = useEndpoint('POST', 'cloud.createRegistrationIntent');

	return (
		<CloudAccountEmailPage
			currentStep={currentStep}
			onBackButtonClick={goToPreviousStep}
			onSubmit={registerServer}
			validateEmail={validateEmail}
			stepCount={4}
		/>
	);
};

export default CloudAccountStep;
