import { Box, Button, Callout, Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput, Throbber } from '@rocket.chat/fuselage';
import { VerticalWizardLayout } from '@rocket.chat/layout';
import {
	useAssetWithDarkModePath,
	useEndpoint,
	useLoginWithPassword,
	useRouteParameter,
	useRouter,
	useSetting,
	useToastMessageDispatch,
	useTranslation,
} from '@rocket.chat/ui-contexts';
import { RegisterForm } from '@rocket.chat/web-ui-registration';
import React, { useMemo, useState, type ReactNode } from 'react';

type RegistrationPrefill = {
	name?: string;
	email?: string;
	username?: string;
	phone?: string;
	reason?: string;
	pharmacyId?: string;
};

const PatientRegistrationLinkPage = (): JSX.Element => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const hideLogo = useSetting('Layout_Login_Hide_Logo', false);
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');
	const token = String(useRouteParameter('token') || '');
	const loginWithPassword = useLoginWithPassword();
	const verifyRegistration = useEndpoint('POST', '/v1/medsense/registration.verify');
	const resendRegistration = useEndpoint('POST', '/v1/medsense/registration.resend');
	const getPrefill = useEndpoint('GET', '/v1/medsense/registration.prefill');
	const completeRegistration = useEndpoint('POST', '/v1/medsense/registration.complete');

	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [verificationSession, setVerificationSession] = useState('');
	const [prefill, setPrefill] = useState<RegistrationPrefill | null>(null);
	const [isCompleted, setIsCompleted] = useState(false);

	const initialValues = useMemo(
		() =>
			prefill
				? {
						name: prefill.name || '',
						email: prefill.email || '',
						username: prefill.username || '',
						phoneNumber: prefill.phone || '',
						reason: prefill.reason || '',
						pharmacyId: prefill.pharmacyId || '',
					}
				: undefined,
		[prefill],
	);

	const handleVerify = async (): Promise<void> => {
		if (!token || !code.trim()) {
			return;
		}
		setError(null);
		setIsVerifying(true);
		try {
			const verifyResult = await verifyRegistration({ token, code: code.trim() });
			const session = String(verifyResult?.verificationSession || '');
			if (!session) {
				throw new Error('Invalid verification response');
			}
			const prefillResponse = await getPrefill({ token, verificationSession: session });
			console.info('[Medsense][RegistrationPrefill][PatientOpen]', {
				tokenPrefix: token.slice(0, 8),
				verificationSessionPrefix: session.slice(0, 8),
				prefill: prefillResponse?.prefill || {},
			});
			setVerificationSession(session);
			setPrefill((prefillResponse?.prefill || {}) as RegistrationPrefill);
			dispatchToastMessage({ type: 'success', message: t('Verification_successful') });
		} catch (e: any) {
			setError(e?.message || t('Verification_failed'));
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResend = async (): Promise<void> => {
		if (!token) {
			return;
		}
		setError(null);
		setIsResending(true);
		try {
			await resendRegistration({ token });
			dispatchToastMessage({ type: 'success', message: t('Verification_code_resent') });
		} catch (e: any) {
			setError(e?.message || t('Failed_to_resend_verification_code'));
		} finally {
			setIsResending(false);
		}
	};

	const renderInRegistrationLayout = (content: ReactNode): JSX.Element => (
		<VerticalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={customLogo} alt='Logo' /> : undefined}
		>
			<Box maxWidth='x600' w='full' mi='auto'>
				{content}
			</Box>
		</VerticalWizardLayout>
	);

	if (!token) {
		return renderInRegistrationLayout(
			<Box p='x24'>
				<Callout type='danger'>{t('Invalid_registration_link')}</Callout>
			</Box>,
		);
	}

	if (isCompleted) {
		return renderInRegistrationLayout(
			<Box p='x24' display='flex' flexDirection='column' gap='x16'>
				<Callout type='success'>{t('Registration_completed_successfully')}</Callout>
				<Button primary onClick={() => router.navigate('/home')}>
					{t('Continue')}
				</Button>
			</Box>,
		);
	}

	if (!verificationSession || !prefill) {
		return renderInRegistrationLayout(
			<Box p='x24'>
				<Box fontScale='h2' mb='x16'>
					{t('Verify_registration_code')}
				</Box>
				{error && (
					<Callout type='danger' mbe='x16'>
						{error}
					</Callout>
				)}
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Verification_Code')}</FieldLabel>
						<FieldRow>
							<TextInput value={code} onChange={(event) => setCode(event.currentTarget.value)} placeholder='123456' maxLength={6} />
						</FieldRow>
						{code && code.length < 6 && <FieldError>{t('Code_must_be_6_digits')}</FieldError>}
					</Field>
					<Box display='flex' gap='x8' flexWrap='wrap'>
						<Button primary onClick={handleVerify} disabled={isVerifying || code.trim().length !== 6}>
							{isVerifying ? <Throbber inheritColor /> : t('Verify')}
						</Button>
						<Button onClick={handleResend} disabled={isResending || isVerifying}>
							{isResending ? <Throbber inheritColor /> : t('Resend_code')}
						</Button>
					</Box>
				</FieldGroup>
			</Box>,
		);
	}

	return renderInRegistrationLayout(
		<Box p='x24'>
			{error && (
				<Callout type='danger' mbe='x16'>
					{error}
				</Callout>
			)}
			<RegisterForm
				setLoginRoute={() => undefined}
				hideBackLink
				submitLabel={t('Complete_registration')}
				initialValues={initialValues}
				onSubmit={async (payload) => {
					setError(null);
					await completeRegistration({
						token,
						verificationSession,
						...payload,
					});
					try {
						await loginWithPassword(payload.username, payload.pass);
						router.navigate('/home', { replace: true });
						return;
					} catch (e: any) {
						console.error('Failed to auto-login after registration completion', e);
					}
					setIsCompleted(true);
				}}
			/>
		</Box>,
	);
};

export default PatientRegistrationLinkPage;
