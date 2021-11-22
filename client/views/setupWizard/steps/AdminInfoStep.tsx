import { AdminInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement, ComponentProps } from 'react';

// import { useMethod } from '../../../contexts/ServerContext';
// import { useSessionDispatch } from '../../../contexts/SessionContext';
import { useSetting } from '../../../contexts/SettingsContext';
// import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
// import { useLoginWithPassword } from '../../../contexts/UserContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const AdminInfoStep = (): ReactElement => {
	const t = useTranslation();
	// const loginWithPassword = useLoginWithPassword();
	// const registerUser = useMethod('registerUser');
	// const defineUsername = useMethod('setUsername');

	// const setForceLogin = useSessionDispatch('forceLogin');
	// const callbacks = useCallbacks();
	// const dispatchToastMessage = useToastMessageDispatch();

	const regexpForUsernameValidation = useSetting('UTF8_User_Names_Validation');
	const usernameRegExp = new RegExp(`^${regexpForUsernameValidation}$`);

	const {
		setupWizardData: { adminData },
		setSetupWizardData,
		goToNextStep,
		currentStep,
		validateEmail,
	} = useSetupWizardContext();

	// todo check if username exists
	// todo check if username exists
	// todo check if username exists
	// todo check if username exists
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
			validateUsername={validateUsername}
			validateEmail={validateEmail}
			currentStep={currentStep}
			initialValues={adminData}
			stepCount={4}
			onSubmit={handleSubmit}
		/>
	);
};

export default AdminInfoStep;
