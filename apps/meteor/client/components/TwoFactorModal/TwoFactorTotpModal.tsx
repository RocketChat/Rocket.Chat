import { Box } from '@rocket.chat/fuselage';
import { FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorTotpModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	onDismiss?: () => void;
};

type TwoFactorTotpFormData = {
	code: string;
};

const TwoFactorTotpModal = ({ onConfirm, onClose, onDismiss }: TwoFactorTotpModalProps): ReactElement => {
	const { t } = useTranslation();

	const {
		control,
		handleSubmit,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<TwoFactorTotpFormData>({
		defaultValues: { code: '' },
	});

	const onSubmit = handleSubmit(async ({ code }) => {
		try {
			await onConfirm(code, Method.TOTP);
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
			title={t('Enter_TOTP_password')}
			onClose={onClose}
			onDismiss={onDismiss}
			variant='warning'
			confirmDisabled={isSubmitting}
			tagline={t('Two-factor_authentication')}
			icon={null}
		>
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('Enter_the_code_provided_by_your_authentication_app_to_continue')}</FieldLabel>
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
		</GenericModal>
	);
};

export default TwoFactorTotpModal;
