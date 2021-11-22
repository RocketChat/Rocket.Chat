// import type { RegisterServerPage } from '@rocket.chat/onboarding-ui';
import { Meteor } from 'meteor/meteor';
import React, { useCallback, useMemo, useState, ReactElement, ContextType, useEffect } from 'react';

// import SetupWizardPage from '../SetupWizardPage';
import { callbacks } from '../../../../app/callbacks/lib/callbacks';
import { useMethod, useEndpoint } from '../../../contexts/ServerContext';
import { useSessionDispatch } from '../../../contexts/SessionContext';
import { useSettingSetValue, useSetting } from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useLoginWithPassword, useUserId } from '../../../contexts/UserContext';
import { SetupWizardContext } from '../contexts/SetupWizardContext';
import { useParameters } from '../hooks/useParameters';
import { useStepRouting } from '../hooks/useStepRouting';

const initialData: ContextType<typeof SetupWizardContext>['setupWizardData'] = {
	adminData: { fullname: '', username: '', companyEmail: '', password: '' },
	organizationData: {
		organizationName: '',
		organizationType: '',
		organizationIndustry: '',
		organizationSize: '',
		country: '',
	},
	// eslint-disable-next-line @typescript-eslint/camelcase
	registrationData: { cloudEmail: '', device_code: '', user_code: '' },
};

const emailRegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i;

type HandleRegisterServer = (params: { email: string; resend?: boolean }) => Promise<void>;

const SetupWizardProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const [setupWizardData, setSetupWizardData] = useState(initialData);
	const [currentStep, setCurrentStep] = useStepRouting();
	const { loaded, settings, canDeclineServerRegistration } = useParameters();

	const dispatchToastMessage = useToastMessageDispatch();
	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const cloudEmail = useSetting('Organization_mail') as string;
	const t = useTranslation();

	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');

	const userId = useUserId();
	const loginWithPassword = useLoginWithPassword();
	const setForceLogin = useSessionDispatch('forceLogin');

	const createRegistrationIntent = useEndpoint('POST', 'cloud.createRegistrationIntent');

	useEffect(() => {
		setSetupWizardData((prev) => ({
			...prev,
			registrationData: { ...prev.registrationData, cloudEmail },
		}));
	}, [cloudEmail]);

	const goToPreviousStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep - 1),
		[setCurrentStep],
	);

	const goToNextStep = useCallback(
		() => setCurrentStep((currentStep) => currentStep + 1),
		[setCurrentStep],
	);

	const validateEmail = useCallback(
		(email: string): true | string => {
			if (!emailRegExp.test(email)) {
				return t('Invalid_email');
			}

			return true;
		},
		[t],
	);

	const registerAdminUser = useCallback(async (): Promise<void> => {
		const {
			adminData: { fullname, username, companyEmail, password },
		} = setupWizardData;
		await registerUser({ name: fullname, username, email: companyEmail, pass: password });
		callbacks.run('userRegistered');

		try {
			await loginWithPassword(companyEmail, password);
		} catch (error) {
			if (error instanceof Meteor.Error && error.error === 'error-invalid-email') {
				// onRegistrationEmailSent && onRegistrationEmailSent();
				dispatchToastMessage({ type: 'success', message: t('We_have_sent_registration_email') });
				return;
			}
			if (error instanceof Error || typeof error === 'string') {
				dispatchToastMessage({ type: 'error', message: error });
			}
			throw error;
		}

		setForceLogin(false);

		await defineUsername(username);
		callbacks.run('usernameSet');
	}, [
		defineUsername,
		dispatchToastMessage,
		loginWithPassword,
		registerUser,
		setForceLogin,
		setupWizardData,
		t,
	]);

	const registerServer: HandleRegisterServer = useCallback(
		async ({ email, resend = false }): Promise<void> => {
			if (!userId) {
				try {
					await registerAdminUser();
				} catch (e) {
					if (e instanceof Error || typeof e === 'string')
						return dispatchToastMessage({
							type: 'error',
							message: e,
						});
				}
			}

			try {
				const intentData = await createRegistrationIntent({ resend });
				console.log(intentData);

				setSetupWizardData((prevState) => ({
					...prevState,
					registrationData: { ...intentData, cloudEmail: email },
				}));

				goToNextStep();
				setShowSetupWizard('in_progress');
			} catch (e) {
				console.log(e);
			}
		},
		[
			createRegistrationIntent,
			dispatchToastMessage,
			goToNextStep,
			registerAdminUser,
			setShowSetupWizard,
			userId,
		],
	);

	// const goToFinalStep = useCallback(() => setCurrentStep(FINAL_STEP), [setCurrentStep]);

	const value = useMemo(
		() => ({
			setupWizardData,
			setSetupWizardData,
			currentStep,
			loaded,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			registerAdminUser,
			validateEmail,
			registerServer,
		}),
		[
			setupWizardData,
			setSetupWizardData,
			currentStep,
			loaded,
			registerAdminUser,
			settings,
			canDeclineServerRegistration,
			goToPreviousStep,
			goToNextStep,
			validateEmail,
			registerServer,
		],
	);

	return <SetupWizardContext.Provider value={value}>{children}</SetupWizardContext.Provider>;
};

export default SetupWizardProvider;
