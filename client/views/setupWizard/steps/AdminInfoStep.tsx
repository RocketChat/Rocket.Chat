import { AdminInfoPage } from '@rocket.chat/onboarding-ui';
import React, { ReactElement } from 'react';

// import { useMethod } from '../../../contexts/ServerContext';
// import { useSessionDispatch } from '../../../contexts/SessionContext';
import { useSetting } from '../../../contexts/SettingsContext';
// import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
// import { useLoginWithPassword } from '../../../contexts/UserContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

type AdminInfoStepProps = {
	step: number;
};

type AdminInfoStepPayload = {
	fullname: string;
	companyEmail: string;
	password: string;
	username: string;
};

const emailRegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i;

const AdminInfoStep = ({ step }: AdminInfoStepProps): ReactElement => {
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
	} = useSetupWizardContext();

	const validateUsername = (username: string): boolean | string => {
		if (!usernameRegExp.test(username)) {
			return t('Invalid_username');
		}

		return true;
	};

	const validateEmail = (email: string): boolean | string => {
		if (!emailRegExp.test(email)) {
			return t('Invalid_email');
		}

		return true;
	};

	// const [isUsernameValid, validateUsername] = useState(true);
	// const [isEmailValid, validateEmail] = useState(true);

	// const isContinueEnabled = useMemo(
	// 	() => name && username && email && password,
	// 	[name, username, email, password],
	// );

	// useEffect(() => {
	// 	validateUsername(username && usernameRegExp.test(username));
	// }, [username, usernameRegExp]);

	// useEffect(() => {
	// 	validateEmail(email && emailRegExp.test(email));
	// }, [email, emailRegExp]);

	const handleSubmit = async (data: AdminInfoStepPayload): Promise<void> => {
		setSetupWizardData((prevState) => ({ ...prevState, adminData: data }));
		goToNextStep();
	};

	return (
		<AdminInfoPage
			validateUsername={validateUsername}
			validateEmail={validateEmail}
			currentStep={step}
			initialValues={adminData}
			stepCount={4}
			onSubmit={handleSubmit}
		/>
	);
};

export default AdminInfoStep;
