import { Box, Button } from '@rocket.chat/fuselage';
import { FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorEmailModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	emailOrUsername: string;
};

type TwoFactorEmailFormData = {
	code: string;
};

const TwoFactorEmailModal = ({ onConfirm, onClose, emailOrUsername }: TwoFactorEmailModalProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const {
		control,
		handleSubmit,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<TwoFactorEmailFormData>({
		defaultValues: { code: '' },
	});

	const sendEmailCode = useEndpoint('POST', '/v1/users.2fa.sendEmailCode');

	const onClickResendCode = async (): Promise<void> => {
		try {
			await sendEmailCode({ emailOrUsername });
			dispatchToastMessage({ type: 'success', message: t('Email_sent') });
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-email-send-failed', { message: error }),
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
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('Enter_the_code_we_just_emailed_you')}</FieldLabel>
					<FieldRow>
						<Controller
							name='code'
							control={control}
							rules={{ required: t('Required_field', { field: t('Code') }) }}
							render={({ field }) => (
								<TextInput
									{...field}
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
			<Button display='flex' justifyContent='end' onClick={onClickResendCode} small mbs={24}>
				{t('Cloud_resend_email')}
			</Button>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
