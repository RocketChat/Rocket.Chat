import { Box, Button, ButtonGroup, Stack } from '@rocket.chat/fuselage';
import { FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

export type TwoFactorEmailModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	invalidAttempt?: boolean;
} & (
	| {
			emailOrUsername: string;
			challengeId?: never;
	  }
	| {
			challengeId: string;
			emailOrUsername?: never;
	  }
);

type TwoFactorEmailFormData = {
	code: string;
};

const TwoFactorEmailModal = ({ onConfirm, onClose, invalidAttempt, emailOrUsername, challengeId }: TwoFactorEmailModalProps) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const {
		control,
		handleSubmit,
		setError,
		setValue,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<TwoFactorEmailFormData>({
		defaultValues: { code: '' },
	});

	useEffect(() => {
		if (invalidAttempt) {
			setError('code', {
				type: 'manual',
				message: t('Invalid_two_factor_code'),
			});
		}
	}, [invalidAttempt, setError, t]);

	const sendEmailCode = useEndpoint('POST', '/v1/users.2fa.sendEmailCode');
	const sendEmailCodeByChallengeId = useEndpoint('POST', '/v1/twoFactorChallenges.sendEmailCode');

	const onClickResendCode = async (): Promise<void> => {
		try {
			if (emailOrUsername) {
				await sendEmailCode({ emailOrUsername });
			} else if (challengeId) {
				await sendEmailCodeByChallengeId({ challengeId });
			}
			dispatchToastMessage({ type: 'success', message: t('Two-factor_email_code_requested') });
		} catch (error) {
			const { errorType } = error as { errorType?: string };
			const expired = errorType === 'error-challenge-expired' || errorType === 'error-challenge-not-found';
			dispatchToastMessage({
				type: 'error',
				message: expired ? t('Two-factor_authentication_expired') : t('error-email-send-failed', { message: error }),
			});
		}
	};

	const onSubmit = handleSubmit(async ({ code }) => {
		try {
			await onConfirm(code, Method.EMAIL);
		} catch (error) {
			setError('code', {
				type: 'manual',
				message: t('Invalid_two_factor_code'),
			});
			setValue('code', '');
		}
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onSubmit} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Enter_authentication_code')}
			onClose={onClose}
			variant='warning'
			confirmDisabled={isSubmitting}
			tagline={t('Email_two-factor_authentication')}
			icon={null}
		>
			<Stack gap={24}>
				<FieldGroup>
					<Field>
						<FieldLabel>{t('Enter_the_code_we_just_emailed_you')}</FieldLabel>
						<FieldRow>
							<Controller
								name='code'
								control={control}
								rules={{ required: t('Required_field', { field: t('Code') }) }}
								render={({ field: { onChange, ...fieldProps } }) => (
									<TextInput
										{...fieldProps}
										onChange={(e) => {
											clearErrors('code');
											onChange(e);
										}}
										placeholder={t('Enter_code_here')}
										autoComplete='one-time-code'
										inputMode='numeric'
										disabled={isSubmitting}
										error={errors.code?.message}
									/>
								)}
							/>
						</FieldRow>
						{errors.code && <FieldError>{errors.code.message}</FieldError>}
					</Field>
				</FieldGroup>
				<ButtonGroup>
					<Button onClick={onClickResendCode} small>
						{t('Cloud_resend_email')}
					</Button>
				</ButtonGroup>
			</Stack>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
