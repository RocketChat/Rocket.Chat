import { StandaloneServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSettingSetValue } from '../../../contexts/SettingsContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountStep = (): ReactElement => {
	const { goToPreviousStep, currentStep, registerAdminUser } = useSetupWizardContext();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');

	const handleConfirmStandalone: ComponentProps<typeof StandaloneServerPage>['onSubmit'] = async () => {
		// TO-DO change form registerType
		// if (registerType !== 'registered') {
		// 	await registerAdminUser();
		// 	return setShowSetupWizard('completed');
		// }
		await registerAdminUser();
		return setShowSetupWizard('completed');
	};

	return (
		<StandaloneServerPage currentStep={currentStep} onBackButtonClick={goToPreviousStep} onSubmit={handleConfirmStandalone} stepCount={4} />
	);
};

export default CloudAccountStep;
