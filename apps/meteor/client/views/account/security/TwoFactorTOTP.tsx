import { Box, Button, TextInput, Margins } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUser, useMethod, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentProps } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import qrcode from 'yaqrcode';

import TextCopy from '../../../components/TextCopy';
import TwoFactorTotpModal from '../../../components/TwoFactorModal/TwoFactorTotpModal';
import BackupCodesModal from './BackupCodesModal';

const TwoFactorTOTP = (props: ComponentProps<typeof Box>): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const setModal = useSetModal();

	const logoutOtherSessions = useEndpoint('POST', '/v1/users.logoutOtherClients');
	const enableTotpFn = useMethod('2fa:enable');
	const disableTotpFn = useMethod('2fa:disable');
	const verifyCodeFn = useMethod('2fa:validateTempToken');
	const checkCodesRemainingFn = useMethod('2fa:checkCodesRemaining');
	const regenerateCodesFn = useMethod('2fa:regenerateCodes');

	const [registeringTotp, setRegisteringTotp] = useSafely(useState(false));
	const [qrCode, setQrCode] = useSafely(useState<string>());
	const [totpSecret, setTotpSecret] = useSafely(useState<string>());
	const [codesRemaining, setCodesRemaining] = useSafely(useState(0));

	const { register, handleSubmit } = useForm({ defaultValues: { authCode: '' } });

	const totpEnabled = user?.services?.totp?.enabled;

	const closeModal = useCallback(() => setModal(null), [setModal]);

	useEffect(() => {
		const updateCodesRemaining = async (): Promise<void | boolean> => {
			if (!totpEnabled) {
				return false;
			}
			const result = await checkCodesRemainingFn();
			setCodesRemaining(result.remaining);
		};
		updateCodesRemaining();
	}, [checkCodesRemainingFn, setCodesRemaining, totpEnabled]);

	const handleEnableTotp = useCallback(async () => {
		try {
			const result = await enableTotpFn();

			setTotpSecret(result.secret);
			setQrCode(qrcode(result.url, { size: 200 }));

			setRegisteringTotp(true);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, enableTotpFn, setQrCode, setRegisteringTotp, setTotpSecret]);

	const handleDisableTotp = useCallback(async () => {
		const onDisable = async (authCode: string): Promise<void> => {
			try {
				const result = await disableTotpFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}

				dispatchToastMessage({ type: 'success', message: t('Two-factor_authentication_disabled') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(<TwoFactorTotpModal onConfirm={onDisable} onClose={closeModal} />);
	}, [closeModal, disableTotpFn, dispatchToastMessage, setModal, t]);

	const handleVerifyCode = useCallback(
		async ({ authCode }) => {
			try {
				const result = await verifyCodeFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}

				logoutOtherSessions();
				setModal(<BackupCodesModal codes={result.codes} onClose={closeModal} />);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, logoutOtherSessions, setModal, t, verifyCodeFn],
	);

	const handleRegenerateCodes = useCallback(() => {
		const onRegenerate = async (authCode: string): Promise<void> => {
			try {
				const result = await regenerateCodesFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}
				setModal(<BackupCodesModal codes={result.codes} onClose={closeModal} />);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		setModal(<TwoFactorTotpModal onConfirm={onRegenerate} onClose={closeModal} />);
	}, [closeModal, dispatchToastMessage, regenerateCodesFn, setModal, t]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' {...props}>
			<Margins blockEnd={8}>
				<Box fontScale='h4'>{t('Two-factor_authentication')}</Box>
				{!totpEnabled && !registeringTotp && (
					<>
						<Box>{t('Two-factor_authentication_is_currently_disabled')}</Box>
						<Button primary onClick={handleEnableTotp}>
							{t('Enable_two-factor_authentication')}
						</Button>
					</>
				)}
				{!totpEnabled && registeringTotp && (
					<>
						<Box>{t('Scan_QR_code')}</Box>
						<Box>{t('Scan_QR_code_alternative_s')}</Box>
						<TextCopy text={totpSecret || ''} />
						<Box is='img' size='x200' src={qrCode} aria-hidden='true' />
						<Box display='flex' flexDirection='row' w='full'>
							<TextInput placeholder={t('Enter_authentication_code')} {...register('authCode')} />
							<Button primary onClick={handleSubmit(handleVerifyCode)}>
								{t('Verify')}
							</Button>
						</Box>
					</>
				)}
				{totpEnabled && (
					<>
						<Button danger onClick={handleDisableTotp}>
							{t('Disable_two-factor_authentication')}
						</Button>
						<Box fontScale='p2m' mbs={8}>
							{t('Backup_codes')}
						</Box>
						<Box>{t('You_have_n_codes_remaining', { number: codesRemaining })}</Box>
						<Button onClick={handleRegenerateCodes}>{t('Regenerate_codes')}</Button>
					</>
				)}
			</Margins>
		</Box>
	);
};

export default TwoFactorTOTP;
