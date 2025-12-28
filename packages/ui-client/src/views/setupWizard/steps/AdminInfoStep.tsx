import { AdminInfoPage } from '@rocket.chat/onboarding-ui';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const toRegExp = (username: string): RegExp => new RegExp(`^${escapeRegExp(username).trim()}$`, 'i');
const usernameBlackList = ['all', 'here', 'admin'].map(toRegExp);
const hasBlockedName = (username: string): boolean =>
	!!usernameBlackList.length && usernameBlackList.some((restrictedUsername) => restrictedUsername.test(escapeRegExp(username).trim()));

const AdminInfoStep = (): ReactElement => {
	const { t, i18n } = useTranslation();
	const regexpForUsernameValidation = useSetting('UTF8_User_Names_Validation');
	const usernameRegExp = new RegExp(`^${regexpForUsernameValidation}$`);

	const { currentStep, validateEmail, registerAdminUser, maxSteps } = useSetupWizardContext();

	// TODO: check if username exists
	const validateUsername = (username: string): boolean | string => {
		if (!usernameRegExp.test(username) || hasBlockedName(username)) {
			return t('Invalid_username');
		}

		return true;
	};

	const handleSubmit: ComponentProps<typeof AdminInfoPage>['onSubmit'] = async (data) => {
		registerAdminUser(data);
	};

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<AdminInfoPage
				validatePassword={(password) => password.length > 0}
				passwordRulesHint=''
				validateUsername={validateUsername}
				validateEmail={validateEmail}
				currentStep={currentStep}
				stepCount={maxSteps}
				onSubmit={handleSubmit}
			/>
		</I18nextProvider>
	);
};

export default AdminInfoStep;
