import React, { ReactElement } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useSessionDispatch } from '../../contexts/SessionContext';
import { useSettingSetValue } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLoginWithPassword } from '../../contexts/UserContext';
import { useCallbacks } from '../../hooks/useCallbacks';
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
	const registerCloudWorkspace = useMethod('cloud:registerWorkspace');
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const { goToNextStep, setupWizardData, setSetupWizardData } = useSetupWizardContext();
	const dispatchToastMessage = useToastMessageDispatch();
	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');
	const callbacks = useCallbacks();
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
	}) => {
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
		console.log(adminData);

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

	const handleSelectServerType = ({ _agreement, _updates, registerType }) => {
		if (registerType !== 'registered') {
			handleRegisterAdminUser();
			return setShowSetupWizard('completed');
		}

		goToNextStep();
	};

	const handleRegisterServer = async (data): Promise<void> => {
		console.log(data);

		try {
			await handleRegisterAdminUser();
		} catch (e) {
			return dispatchToastMessage({
				type: 'error',
				message: e,
			});
		}

		try {
			const intentData = await registerCloudWorkspace();
			setSetupWizardData((prevState) => ({ ...prevState, cloudRegistrationData: intentData }));
			goToNextStep();
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

	// return (
	// 	<Box
	// 		width='full'
	// 		height='sh'
	// 		display='flex'
	// 		flexDirection={small ? 'column' : 'row'}
	// 		alignItems='stretch'
	// 		style={{ backgroundColor: 'var(--color-dark-05, #f1f2f4)' }}
	// 		data-qa='setup-wizard'
	// 	>
	// 		{(currentStep === FINAL_STEP && <FinalStep />) || (
	// 			<>
	// 				<SideBar
	// 					steps={[
	// 						{
	// 							step: 1,
	// 							title: t('Admin_Info'),
	// 						},
	// 						{
	// 							step: 2,
	// 							title: t('Organization_Info'),
	// 						},
	// 						{
	// 							step: 3,
	// 							title: t('Server_Info'),
	// 						},
	// 						{
	// 							step: 4,
	// 							title: t('Register_Server'),
	// 						},
	// 					]}
	// 					currentStep={currentStep}
	// 				/>
	// 				<Box flexGrow={1} flexShrink={1} minHeight='none' display='flex' flexDirection='column'>
	// 					<ScrollableContentWrapper>
	// 						<Margins all='x16'>
	// 							<Tile is='section' flexGrow={1} flexShrink={1}>
	// 								<AdminUserInformationStep
	// 									step={1}
	// 									title={t('Admin_Info')}
	// 									active={currentStep === 1}
	// 								/>
	// 								<SettingsBasedStep
	// 									step={2}
	// 									title={t('Organization_Info')}
	// 									active={currentStep === 2}
	// 								/>
	// 								<SettingsBasedStep step={3} title={t('Server_Info')} active={currentStep === 3} />
	// 								<RegisterServerStep
	// 									step={4}
	// 									title={t('Register_Server')}
	// 									active={currentStep === 4}
	// 								/>
	// 							</Tile>
	// 						</Margins>
	// 					</ScrollableContentWrapper>
	// 				</Box>
	// 			</>
	// 		)}
	// 	</Box>
	// );
};

export default SetupWizardPage;
