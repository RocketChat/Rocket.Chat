import { Box, Button, TextInput, Margins, Field, FieldRow, FieldLabel, ToggleSwitch } from '@rocket.chat/fuselage';
import { useEffectEvent, useSafely } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useUser, useMethod } from '@rocket.chat/ui-contexts';
import type { ReactElement, ComponentPropsWithoutRef, FormEvent } from 'react';
import { useState, useCallback, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import qrcode from 'yaqrcode';

import BackupCodesModal from './BackupCodesModal';
import TextCopy from '../../../components/TextCopy';
import TwoFactorTotpModal from '../../../components/TwoFactorModal/TwoFactorTotpModal';

type TwoFactorTOTPFormData = {
	authCode: string;
};

type TwoFactorTOTPProps = ComponentPropsWithoutRef<typeof Box>;

const TwoFactorTOTP = (props: TwoFactorTOTPProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const setModal = useSetModal();

	const enableTotpFn = useMethod('2fa:enable');
	const disableTotpFn = useMethod('2fa:disable');
	const verifyCodeFn = useMethod('2fa:validateTempToken');
	const checkCodesRemainingFn = useMethod('2fa:checkCodesRemaining');
	const regenerateCodesFn = useMethod('2fa:regenerateCodes');

	const [registeringTotp, setRegisteringTotp] = useSafely(useState(false));
	const [qrCode, setQrCode] = useSafely(useState<string>());
	const [totpSecret, setTotpSecret] = useSafely(useState<string>());
	const [codesRemaining, setCodesRemaining] = useSafely(useState(0));

	const { register, handleSubmit } = useForm<TwoFactorTOTPFormData>({ defaultValues: { authCode: '' } });

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

	const enableTotp = useEffectEvent(async () => {
		try {
			const result = await enableTotpFn();

			setTotpSecret(result.secret);
			setQrCode(qrcode(result.url, { size: 200 }));

			setRegisteringTotp(true);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const disableTotp = useEffectEvent(async () => {
		if (!totpEnabled) {
			setRegisteringTotp(false);

			return;
		}

		const onDisable = async (authCode: string): Promise<void> => {
			try {
				const result = await disableTotpFn(authCode);

				if (!result) {
					dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });

					return;
				}

				dispatchToastMessage({ type: 'success', message: t('Two-factor_authentication_disabled') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}

			closeModal();
		};

		setModal(<TwoFactorTotpModal onConfirm={onDisable} onClose={closeModal} />);
	});

	const handleToggleTotp = useEffectEvent(async (e: FormEvent<HTMLInputElement>) => {
		if (e.currentTarget?.checked) {
			void enableTotp();
		} else {
			void disableTotp();
		}
	});

	const totpId = useId();
	const totpCodeId = useId();

	const handleVerifyCode = useCallback(
		async ({ authCode }: TwoFactorTOTPFormData) => {
			try {
				const result = await verifyCodeFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}

				setRegisteringTotp(false);
				setModal(<BackupCodesModal codes={result.codes} onClose={closeModal} />);

				dispatchToastMessage({ type: 'success', message: t('Two-factor_authentication_enabled') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, setModal, t, verifyCodeFn, setRegisteringTotp],
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

		setModal(<TwoFactorTotpModal onDismiss={() => undefined} onConfirm={onRegenerate} onClose={closeModal} />);
	}, [closeModal, dispatchToastMessage, setModal, regenerateCodesFn, t]);

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' {...props}>
			<Margins blockEnd={8}>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={totpId}>{t('Two-factor_authentication_via_TOTP')}</FieldLabel>
						<ToggleSwitch id={totpId} checked={registeringTotp || totpEnabled} onChange={handleToggleTotp} />
					</FieldRow>
				</Field>
				{!totpEnabled && registeringTotp && (
					<>
						<Box>{t('Scan_QR_code')}</Box>
						<Box>{t('Scan_QR_code_alternative_s')}</Box>
						<TextCopy text={totpSecret || ''} />
						<Box mis='-16px' mb='-16px' is='img' size='x200' src={qrCode} aria-hidden='true' />
						<Field>
							<FieldLabel htmlFor={totpCodeId}>{t('Enter_code_provided_by_authentication_app')}</FieldLabel>
							<FieldRow>
								<TextInput id={totpCodeId} mie='8px' {...register('authCode')} />
								<Button primary onClick={handleSubmit(handleVerifyCode)}>
									{t('Verify')}
								</Button>
							</FieldRow>
						</Field>
					</>
				)}
				{totpEnabled && (
					<>
						<Box fontScale='p2m' mbs={8}>
							{t('Backup_codes')}
						</Box>
						<Box color='font-secondary-info'>{t('You_have_n_codes_remaining', { number: codesRemaining })}</Box>
						<Button onClick={handleRegenerateCodes}>{t('Regenerate_codes')}</Button>
					</>
				)}
			</Margins>
		</Box>
	);
};

export default TwoFactorTOTP;
