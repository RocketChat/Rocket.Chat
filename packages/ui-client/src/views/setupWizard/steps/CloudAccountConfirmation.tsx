import { Button, Callout } from '@rocket.chat/fuselage';
import { AwaitingConfirmationPage } from '@rocket.chat/onboarding-ui';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useCallback, useRef, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useSetupWizardContext } from '../contexts/SetupWizardContext';

const setIntervalTime = (interval?: number): number => (interval ? interval * 1000 : 0);

const CloudAccountConfirmation = () => {
	const {
		registerServer,
		currentStep,
		maxSteps,
		goToStep,
		setupWizardData: { registrationData },
		completeCloudRegistration,
	} = useSetupWizardContext();
	const cloudConfirmationPoll = useEndpoint('GET', '/v1/cloud.confirmationPoll');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t, i18n } = useTranslation();
	const isPolling = useRef(false);
	const [confirmedDeviceCode, setConfirmedDeviceCode] = useState<string>();

	const deviceCode = registrationData.device_code;
	const isConfirmed = !!deviceCode && confirmedDeviceCode === deviceCode;

	const { mutate: complete, isError: hasCompletionFailed } = useMutation({
		mutationFn: completeCloudRegistration,
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const getConfirmation = useCallback(async () => {
		if (isPolling.current || !deviceCode) {
			return;
		}

		isPolling.current = true;
		try {
			const { pollData } = await cloudConfirmationPoll({ deviceCode });

			if ('successful' in pollData && pollData.successful) {
				setConfirmedDeviceCode(deviceCode);
				complete();
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			isPolling.current = false;
		}
	}, [cloudConfirmationPoll, deviceCode, complete, dispatchToastMessage]);

	useEffect(() => {
		if (isConfirmed) {
			return;
		}

		const pollInterval = setInterval(() => getConfirmation(), setIntervalTime(registrationData.interval));

		return (): void => clearInterval(pollInterval);
	}, [getConfirmation, isConfirmed, registrationData.interval]);

	return (
		<I18nextProvider i18n={i18n} defaultNS='onboarding'>
			<AwaitingConfirmationPage
				currentStep={currentStep}
				stepCount={maxSteps}
				emailAddress={registrationData.cloudEmail}
				securityCode={registrationData.user_code}
				description={
					hasCompletionFailed && (
						<Callout
							type='danger'
							title={t('Something_went_wrong')}
							actions={
								<Button small onClick={() => complete()}>
									{t('Retry')}
								</Button>
							}
						/>
					)
				}
				onResendEmailRequest={(): Promise<void> => registerServer({ email: registrationData.cloudEmail, resend: true })}
				onChangeEmailRequest={(): void => goToStep(3)}
			/>
		</I18nextProvider>
	);
};

export default CloudAccountConfirmation;
