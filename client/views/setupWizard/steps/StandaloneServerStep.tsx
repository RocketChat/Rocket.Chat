import { StandaloneServerPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSettingSetValue } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const CloudAccountStep = (): ReactElement => {
	const { goToPreviousStep, currentStep, registerAdminUser, saveOrganizationData } = useSetupWizardContext();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleConfirmStandalone: ComponentProps<typeof StandaloneServerPage>['onSubmit'] = async ({ registerType }) => {
		if (registerType !== 'registered') {
			await registerAdminUser();
			await saveOrganizationData();
			dispatchToastMessage({ type: 'success', message: t('Your_workspace_is_ready') });
			return setShowSetupWizard('completed');
		}
	};

	return (
		<StandaloneServerPage currentStep={currentStep} onBackButtonClick={goToPreviousStep} onSubmit={handleConfirmStandalone} stepCount={4} />
	);
};

export default CloudAccountStep;
