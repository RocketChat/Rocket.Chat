import { AdminInfoPage } from '@rocket.chat/onboarding-ui';
import type { ComponentProps } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const AdminInfoStep = () => {
	const { i18n } = useTranslation();

	const { currentStep, maxSteps, validateEmail, validateUsername, validatePassword, passwordRulesHint, registerAdminUser } =
		useSetupWizardContext();

	const handleSubmit: ComponentProps<typeof AdminInfoPage>['onSubmit'] = async (data) => {
		void registerAdminUser(data);
	};

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<AdminInfoPage
				validatePassword={validatePassword}
				passwordRulesHint={passwordRulesHint}
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
