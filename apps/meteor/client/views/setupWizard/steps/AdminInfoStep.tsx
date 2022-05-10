import { AdminInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const AdminInfoStep = (): ReactElement => {
	const t = useTranslation();
	const regexpForUsernameValidation = useSetting('UTF8_User_Names_Validation');
	const usernameRegExp = new RegExp(`^${regexpForUsernameValidation}$`);

	const {
		setupWizardData: { adminData },
		setSetupWizardData,
		goToNextStep,
		currentStep,
		validateEmail,
		maxSteps,
	} = useSetupWizardContext();

	// TODO: check if username exists
	const validateUsername = (username: string): boolean | string => {
		if (!usernameRegExp.test(username)) {
			return t('Invalid_username');
		}

		return true;
	};

	const handleSubmit: ComponentProps<typeof AdminInfoPage>['onSubmit'] = async (data) => {
		setSetupWizardData((prevState) => ({ ...prevState, adminData: data }));
		goToNextStep();
	};

	return (
		<AdminInfoPage
			validatePassword={(password): boolean => password.length > 0}
			passwordRulesHint={''}
			validateUsername={validateUsername}
			validateEmail={validateEmail}
			currentStep={currentStep}
			initialValues={adminData}
			stepCount={maxSteps}
			onSubmit={handleSubmit}
		/>
	);
};

export default AdminInfoStep;
