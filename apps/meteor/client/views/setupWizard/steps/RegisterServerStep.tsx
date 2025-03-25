import { RegisterServerPage, RegisterOfflinePage } from '@rocket.chat/onboarding-ui';
import { useEndpoint, useMethod } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement, ComponentProps } from 'react';
import { useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useInvalidateLicense } from '../../../hooks/useLicense';
import { dispatchToastMessage } from '../../../lib/toast';
import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const SERVER_OPTIONS = {
	REGISTERED: 'REGISTERED',
	OFFLINE: 'OFFLINE',
};

const RegisterServerStep = (): ReactElement => {
	const { t, i18n } = useTranslation();
	const { currentStep, goToNextStep, setSetupWizardData, registerServer, maxSteps, completeSetupWizard, saveAgreementData } =
		useSetupWizardContext();
	const [serverOption, setServerOption] = useState(SERVER_OPTIONS.REGISTERED);
	const invalidateLicenseQuery = useInvalidateLicense();

	const handleRegister: ComponentProps<typeof RegisterServerPage>['onSubmit'] = async (data: {
		email: string;
		agreement: boolean;
		updates: boolean;
		resend?: boolean;
	}) => {
		goToNextStep();
		setSetupWizardData((prevState) => ({ ...prevState, serverData: data }));
		await registerServer(data);
	};

	const registerManually = useEndpoint('POST', '/v1/cloud.manualRegister');
	const registerPreIntent = useEndpoint('POST', '/v1/cloud.registerPreIntent');
	const getWorkspaceRegisterData = useMethod('cloud:getWorkspaceRegisterData');

	const { data: clientKey } = useQuery({
		queryKey: ['setupWizard/clientKey'],
		queryFn: async () => getWorkspaceRegisterData(),
		staleTime: Infinity,
	});

	const {
		data: offline,
		isPending,
		isError,
	} = useQuery({
		queryKey: ['setupWizard/registerIntent'],
		queryFn: async () => registerPreIntent(),
		staleTime: Infinity,
		select: (data) => data.offline,
	});

	const { mutate } = useMutation({
		mutationKey: ['setupWizard/confirmOfflineRegistration'],
		mutationFn: async (token: string) => registerManually({ cloudBlob: token }),

		onSuccess: () => {
			invalidateLicenseQuery(100);
			completeSetupWizard();
		},

		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Cloud_register_error') });
		},
	});

	const handleConfirmOffline: ComponentProps<typeof RegisterOfflinePage>['onSubmit'] = async ({ token, agreement }) => {
		await saveAgreementData(agreement);
		mutate(token);
	};

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			{serverOption === SERVER_OPTIONS.OFFLINE ? (
				<RegisterOfflinePage
					termsHref='https://rocket.chat/terms'
					policyHref='https://rocket.chat/privacy'
					clientKey={clientKey || ''}
					onCopySecurityCode={(): void => dispatchToastMessage({ type: 'success', message: t('Copied') })}
					onBackButtonClick={(): void => setServerOption(SERVER_OPTIONS.REGISTERED)}
					onSubmit={handleConfirmOffline}
				/>
			) : (
				<RegisterServerPage
					onClickRegisterOffline={(): void => setServerOption(SERVER_OPTIONS.OFFLINE)}
					stepCount={maxSteps}
					onSubmit={handleRegister}
					currentStep={currentStep}
					offline={isError || (!isPending && offline)}
				/>
			)}
		</I18nextProvider>
	);
};

export default RegisterServerStep;
