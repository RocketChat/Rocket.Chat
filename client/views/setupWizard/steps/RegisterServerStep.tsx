import { RegisterServerPage } from '@rocket.chat/onboarding-ui';
import React, { ComponentProps, ReactElement } from 'react';

import { useSettingSetValue } from '../../../contexts/SettingsContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const RegisterServerStep = (): ReactElement => {
	const {
		// canDeclineServerRegistration,
		registerAdminUser,
		goToPreviousStep,
		goToNextStep,
		currentStep,
		// goToFinalStep,
	} = useSetupWizardContext();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');

	const handleSelectServerType: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async ({
		registerType,
	}) => {
		if (registerType !== 'registered') {
			await registerAdminUser();
			return setShowSetupWizard('completed');
		}

		setShowSetupWizard('in_progress');
		return goToNextStep();
	};

	return (
		<RegisterServerPage
			onBackButtonClick={goToPreviousStep}
			stepCount={4}
			onSubmit={handleSelectServerType}
			currentStep={currentStep}
		/>
	);
};

export default RegisterServerStep;
