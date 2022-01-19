import { RegisteredServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const RegisterServerStep = (): ReactElement => {
	const { goToPreviousStep, goToNextStep, currentStep, setSetupWizardData, registerServer } = useSetupWizardContext();

	const handleSubmit: ComponentProps<typeof RegisteredServerPage>['onSubmit'] = async (data) => {
		// TO-DO FIX REGISTER_TYPE
		// 	if (registerType !== 'registered') {
		// 		await registerAdminUser();
		// 		return setShowSetupWizard('completed');
		// 	}

		setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
		await registerServer(data);
	};

	return (
		<RegisteredServerPage
			onClickContinue={goToNextStep}
			onBackButtonClick={goToPreviousStep}
			stepCount={4}
			onSubmit={handleSubmit}
			currentStep={currentStep}
		/>
	);
};

export default RegisterServerStep;
