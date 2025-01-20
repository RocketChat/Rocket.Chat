import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useToastMessageDispatch,
	useSessionDispatch,
	useLoginWithPassword,
	useSettingSetValue,
	useSettingsDispatch,
	useMethod,
	useEndpoint,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';
import type { ReactElement, ContextType } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { callbacks } from '../../../../lib/callbacks';
import { validateEmail } from '../../../../lib/emailValidator';
import { useInvalidateLicense } from '../../../hooks/useLicense';
import { SetupWizardContext } from '../contexts/SetupWizardContext';
import { useParameters } from '../hooks/useParameters';
import { useStepRouting } from '../hooks/useStepRouting';

const initialData: ContextType<typeof SetupWizardContext>['setupWizardData'] = {
	organizationData: {
		organizationName: '',
		organizationIndustry: '',
		organizationSize: '',
		country: '',
	},
	serverData: {
		agreement: false,
		email: '',
		updates: false,
	},
	registrationData: { cloudEmail: '', device_code: '', user_code: '' },
};

type HandleRegisterServer = (params: { email: string; resend?: boolean }) => Promise<void>;

const SetupWizardProvider = ({ children }: { children: ReactElement }): ReactElement => {
	const invalidateLicenseQuery = useInvalidateLicense();
	const t = useTranslation();
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
	const createRegistrationIntent = useEndpoint('POST', '/v1/cloud.createRegistrationIntent');

	const goToPreviousStep = useCallback(() => setCurrentStep((currentStep) => currentStep - 1), [setCurrentStep]);
	const goToNextStep = useCallback(() => setCurrentStep((currentStep) => currentStep + 1), [setCurrentStep]);
	const goToStep = useCallback((step: number) => setCurrentStep(() => step), [setCurrentStep]);

	const _validateEmail = useCallback(
		(email: string): true | string => {
			if (!validateEmail(email)) {
				return t('Invalid_email');
			}

			return true;
		},
		[t],
	);

	const registerAdminUser = useCallback(
		async ({
			fullname,
			username,
			email,
			password,
		}: {
			fullname: string;
			username: string;
			email: string;
			password: string;
		}): Promise<void> => {
			await registerUser({ name: fullname, username, email, pass: password });
			void callbacks.run('userRegistered', {});

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
			void callbacks.run('usernameSet', {});
		},
		[registerUser, setForceLogin, defineUsername, dispatchSettings, loginWithPassword, dispatchToastMessage, t],
	);

	const saveAgreementData = useCallback(
		async (agreement: boolean): Promise<void> => {
			await dispatchSettings([
				{
					_id: 'Cloud_Service_Agree_PrivacyTerms',
					value: agreement,
				},
			]);
		},
		[dispatchSettings],
	);

	const saveWorkspaceData = useCallback(async (): Promise<void> => {
		const {
			serverData: { updates, agreement },
		} = setupWizardData;

		await dispatchSettings([
			{
				_id: 'Register_Server',
				value: true,
			},
			{
				_id: 'Allow_Marketing_Emails',
				value: updates,
			},
		]);
		await saveAgreementData(agreement);
	}, [dispatchSettings, saveAgreementData, setupWizardData]);

	const saveOrganizationData = useCallback(
		async (organizationData: ContextType<typeof SetupWizardContext>['setupWizardData']['organizationData']): Promise<void> => {
			const { organizationName, organizationIndustry, organizationSize, country } = organizationData;

			await dispatchSettings([
				{
					_id: 'Country',
					value: country,
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
		},
		[dispatchSettings],
	);

	const queryClient = useQueryClient();

	const registerServer: HandleRegisterServer = useEffectEvent(
		async ({ email, resend = false }: { email: string; resend?: boolean }): Promise<void> => {
			try {
				const { intentData } = await createRegistrationIntent({ resend, email });
				invalidateLicenseQuery(100);
				queryClient.invalidateQueries({ queryKey: ['getRegistrationStatus'] });

				setSetupWizardData((prevState) => ({
					...prevState,
					registrationData: { ...intentData, cloudEmail: email },
				}));

				goToStep(4);
				setShowSetupWizard('in_progress');
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: t('Cloud_register_error') });
			}
		},
	);

	const completeSetupWizard = useEffectEvent(async (): Promise<void> => {
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
			saveAgreementData,
			saveWorkspaceData,
			saveOrganizationData,
			completeSetupWizard,
			maxSteps: data.serverAlreadyRegistered ? 2 : 4,
		}),
		[
			setupWizardData,
			currentStep,
			isSuccess,
			data.settings,
			data.serverAlreadyRegistered,
			goToPreviousStep,
			goToNextStep,
			goToStep,
			registerAdminUser,
			_validateEmail,
			registerServer,
			saveAgreementData,
			saveWorkspaceData,
			saveOrganizationData,
			completeSetupWizard,
		],
	);

	return <SetupWizardContext.Provider value={value}>{children}</SetupWizardContext.Provider>;
};

export default SetupWizardProvider;
