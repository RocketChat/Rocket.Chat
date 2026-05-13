import { Box } from '@rocket.chat/fuselage';
import { PasswordInput, FieldGroup, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorPasswordModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
};

type TwoFactorPasswordFormData = {
	password: string;
};

const TwoFactorPasswordModal = ({ onConfirm, onClose }: TwoFactorPasswordModalProps): ReactElement => {
	const { t } = useTranslation();

	const {
		control,
		handleSubmit,
		setError,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<TwoFactorPasswordFormData>({
		defaultValues: { password: '' },
	});

	const onSubmit = handleSubmit(async ({ password }) => {
		try {
			await onConfirm(password, Method.PASSWORD);
		} catch (error) {
			setError('password', {
				type: 'manual',
				message: t('Invalid_password'),
			});
			setValue('password', '');
		}
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onSubmit} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Please_enter_your_password')}
			onClose={onClose}
			variant='warning'
			icon='info'
			confirmDisabled={isSubmitting}
		>
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch'>{t('For_your_security_you_must_enter_your_current_password_to_continue')}</FieldLabel>
					<FieldRow>
						<Controller
							name='password'
							control={control}
							rules={{ required: t('Required_field', { field: t('Password') }) }}
							render={({ field }) => (
								<PasswordInput {...field} placeholder={t('Password')} disabled={isSubmitting} error={errors.password?.message} />
							)}
						/>
					</FieldRow>
					{errors.password && <FieldError>{errors.password.message}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default TwoFactorPasswordModal;
