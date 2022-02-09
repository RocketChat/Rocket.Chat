import { RegisteredServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const RegisterServerStep = (): ReactElement => {
	const {
		goToPreviousStep,
		goToNextStep,
		currentStep,
		setSetupWizardData,
		setupWizardData: { adminData },
		registerServer,
		maxSteps,
	} = useSetupWizardContext();

	const handleSubmit: ComponentProps<typeof RegisteredServerPage>['onSubmit'] = async (data) => {
		if (data.registerType !== 'standalone') {
			setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
			await registerServer(data);
		}
	};

	return (
		<RegisteredServerPage
			onClickContinue={goToNextStep}
			onBackButtonClick={goToPreviousStep}
			stepCount={maxSteps}
			onSubmit={handleSubmit}
			currentStep={currentStep}
			initialValues={{ email: adminData.companyEmail }}
		/>
	);
};

export default RegisterServerStep;
