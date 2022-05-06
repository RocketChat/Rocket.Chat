import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useToastMessageDispatch,
	useSessionDispatch,
	useLoginWithPassword,
	useSettingSetValue,
	useSettingsDispatch,
	useRole,
	useMethod,
	useEndpoint,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { useCallback, useMemo, useState, ReactElement, ContextType } from 'react';

import { callbacks } from '../../../../lib/callbacks';
import { validateEmail } from '../../../../lib/emailValidator';
import { SetupWizardContext } from '../contexts/SetupWizardContext';
import { useParameters } from '../hooks/useParameters';
import { useStepRouting } from '../hooks/useStepRouting';

const initialData: ContextType<typeof SetupWizardContext>['setupWizardData'] = {
	adminData: { fullname: '', username: '', email: '', password: '' },
	organizationData: {
		organizationName: '',
		organizationType: '',
		organizationIndustry: '',
		organizationSize: '',
		country: '',
	},
	serverData: {
		agreement: false,
		email: '',
		registerType: 'registered',
		updates: false,
	},
	// eslint-disable-next-line @typescript-eslint/camelcase
	registrationData: { cloudEmail: '', device_code: '', user_code: '' },
};

type HandleRegisterServer = (params: { email: string; resend?: boolean }) => Promise<void>;

const SetupWizardProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const t = useTranslation();
	const hasAdminRole = useRole('admin');
	const [setupWizardData, setSetupWizardData] = useState<ContextType<typeof SetupWizardContext>['setupWizardData']>(initialData);
	const [currentStep, setCurrentStep] = useStepRouting();
	const { isSuccess, data } = useParameters();
	const dispatchToastMessage = useToastMessageDispatch();
	const dispatchSettings = useSettingsDispatch();

	const setShowSetupWizard = useSettingSetValue('Show_Setup_Wizard');
	const registerUser = useMethod('registerUser');
	const defineUsername = useMethod('setUsername');
	const loginWithPassword = useLoginWithPassword();
	const setForceLogin = useSessionDispatch('forceLogin');
	const createRegistrationIntent = useEndpoint('POST', 'cloud.createRegistrationIntent');

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => currentStep - 1), [setCurrentStep]);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), [setCurrentStep]);
	const goToStep = useCallback((step) => setCurrentStep(() => step), [setCurrentStep]);

	const _validateEmail = useCallback(
		(email: string): true | string => {
			if (!validateEmail(email)) {
				return t('Invalid_email');
			}

			return true;
		},
		[t],
	);

	const registerAdminUser = useCallback(async (): Promise<void> => {
		const {
			adminData: { fullname, username, email, password },
		} = setupWizardData;
		await registerUser({ name: fullname, username, email, pass: password });
		callbacks.run('userRegistered', {});

		try {
			await loginWithPassword(email, password);
		} catch (error) {
			if (error instanceof Meteor.Error && error.error === 'error-invalid-email') {
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
		await dispatchSettings([{ _id: 'Organization_Email', value: email }]);
		callbacks.run('usernameSet', {});
	}, [defineUsername, dispatchToastMessage, loginWithPassword, registerUser, setForceLogin, dispatchSettings, setupWizardData, t]);

	const saveWorkspaceData = useCallback(async (): Promise<void> => {
		const {
			serverData: { updates, agreement },
		} = setupWizardData;

		await dispatchSettings([
			{
				_id: 'Statistics_reporting',
				value: true,
			},
			{
				_id: 'Apps_Framework_enabled',
				value: true,
			},
			{
				_id: 'Register_Server',
				value: true,
			},
			{
				_id: 'Allow_Marketing_Emails',
				value: updates,
			},
			{
				_id: 'Cloud_Service_Agree_PrivacyTerms',
				value: agreement,
			},
		]);
	}, [dispatchSettings, setupWizardData]);

	const saveOrganizationData = useCallback(async (): Promise<void> => {
		const {
			organizationData: { organizationName, organizationType, organizationIndustry, organizationSize, country },
		} = setupWizardData;

		await dispatchSettings([
			{
				_id: 'Country',
				value: country,
			},
			{
				_id: 'Organization_Type',
				value: organizationType,
			},
			{
				_id: 'Industry',
				value: organizationIndustry,
			},
			{
				_id: 'Size',
				value: organizationSize,
			},
			{
				_id: 'Organization_Name',
				value: organizationName,
			},
		]);
	}, [dispatchSettings, setupWizardData]);

	const registerServer: HandleRegisterServer = useMutableCallback(async ({ email, resend = false }): Promise<void> => {
		if (!hasAdminRole) {
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
			await saveOrganizationData();
			const { intentData } = await createRegistrationIntent({ resend, email });

			setSetupWizardData((prevState) => ({
				...prevState,
				registrationData: { ...intentData, cloudEmail: email },
			}));

			goToStep(4);
			setShowSetupWizard('in_progress');
		} catch (e) {
			console.log(e);
		}
	});

	const completeSetupWizard = useMutableCallback(async (): Promise<void> => {
		if (!hasAdminRole) {
			await registerAdminUser();
		}
		await saveOrganizationData();
		dispatchToastMessage({ type: 'success', message: t('Your_workspace_is_ready') });
		return setShowSetupWizard('completed');
	});

	const value = useMemo(
		() => ({
			setupWizardData,
			setSetupWizardData,
			currentStep,
			loaded: isSuccess,
			settings: data.settings,
			skipCloudRegistration: data.serverAlreadyRegistered,
			goToPreviousStep,
			goToNextStep,
			goToStep,
			registerAdminUser,
			validateEmail: _validateEmail,
			registerServer,
			saveWorkspaceData,
			saveOrganizationData,
			completeSetupWizard,
			maxSteps: data.serverAlreadyRegistered ? 2 : 3,
		}),
		[
			setupWizardData,
			setSetupWizardData,
			currentStep,
			isSuccess,
			registerAdminUser,
			data,
			goToPreviousStep,
			goToNextStep,
			goToStep,
			_validateEmail,
			registerServer,
			saveWorkspaceData,
			saveOrganizationData,
			completeSetupWizard,
		],
	);

	return <SetupWizardContext.Provider value={value}>{children}</SetupWizardContext.Provider>;
};

export default SetupWizardProvider;
