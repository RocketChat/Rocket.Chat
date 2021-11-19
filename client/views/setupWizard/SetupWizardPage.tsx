import React, { ReactElement } from 'react';

import { callbacks } from '../../../app/callbacks/lib/callbacks';
import { useEndpoint, useMethod } from '../../contexts/ServerContext';
import { useSessionDispatch } from '../../contexts/SessionContext';
import { useSettingSetValue } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLoginWithPassword, useUserId } from '../../contexts/UserContext';
import { useSetupWizardContext } from './contexts/SetupWizardContext';
import AdminInfoStep from './steps/AdminInfoStep';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation';
import CloudAccountStep from './steps/CloudAccountStep';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import RegisterServerStep from './steps/RegisterServerStep';

type SetupWizardPageProps = {
	currentStep: number;
};

const SetupWizardPage = ({ currentStep = 1 }: SetupWizardPageProps): ReactElement => {
	const createRegistrationIntent = useEndpoint('POST', 'cloud.createRegistrationIntent');
	// const registerCloudWorkspace = useMethod('cloud:registerWorkspace');
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const { goToNextStep, setupWizardData, setSetupWizardData } = useSetupWizardContext();
	const dispatchToastMessage = useToastMessageDispatch();
	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');
	const userId = useUserId();

	const loginWithPassword = useLoginWithPassword();
	const setForceLogin = useSessionDispatch('forceLogin');
	const t = useTranslation();

	const { adminData, organizationData } = setupWizardData;

	const registerAdminUser = async ({
		fullname,
		username,
		companyEmail,
		password,
		onRegistrationEmailSent,
	}): Promise<void> => {
		await registerUser({ name: fullname, username, email: companyEmail, pass: password });
		callbacks.run('userRegistered');

		try {
			await loginWithPassword(companyEmail, password);
		} catch (error) {
			if (error.error === 'error-invalid-email') {
				onRegistrationEmailSent && onRegistrationEmailSent();
				return;
			}
			dispatchToastMessage({ type: 'error', message: error });
			throw error;
		}

		setForceLogin(false);

		await defineUsername(username);
		callbacks.run('usernameSet');
	};

	const handleRegisterAdminUser = async (): Promise<void> => {
		const { fullname, username, companyEmail, password } = adminData;

		await registerAdminUser({
			fullname,
			username,
			companyEmail,
			password,
			onRegistrationEmailSent: () => {
				dispatchToastMessage({ type: 'success', message: t('We_have_sent_registration_email') });
			},
		});
	};

	const handleSelectServerType = async ({ _agreement, _updates, registerType }) => {
		if (registerType !== 'registered') {
			await handleRegisterAdminUser();
			return setShowSetupWizard('completed');
		}

		setShowSetupWizard('in_progress');
		return goToNextStep();
	};

	const handleRegisterServer = async ({ email }): Promise<void> => {
		if (!userId) {
			try {
				await handleRegisterAdminUser();
			} catch (e) {
				return dispatchToastMessage({
					type: 'error',
					message: e,
				});
			}
		}

		try {
			const intentData = await createRegistrationIntent();
			console.log(intentData);

			setSetupWizardData((prevState) => ({
				...prevState,
				cloudRegistrationData: { ...intentData, cloudEmail: email },
			}));

			// setShowSetupWizard('completed');
			goToNextStep();
			setShowSetupWizard('in_progress');
		} catch (e) {
			console.log(e);
		}
	};

	if (currentStep === 2) {
		return <OrganizationInfoStep step={currentStep} />;
	}

	if (currentStep === 3) {
		return (
			<RegisterServerStep step={currentStep} handleSelectServerType={handleSelectServerType} />
		);
	}

	if (currentStep === 4) {
		return <CloudAccountStep step={currentStep} handleRegisterServer={handleRegisterServer} />;
	}

	if (currentStep === 5) {
		return <CloudAccountConfirmation />;
	}

	return <AdminInfoStep step={currentStep} />;
};

export default SetupWizardPage;
