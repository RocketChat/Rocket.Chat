import { Box, PasswordInput, Field, FieldGroup, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type EnterE2EPasswordModalProps = {
	onConfirm: (password: string) => void;
	onClose: () => void;
	onCancel: () => void;
};

const EnterE2EPasswordModal = ({ onConfirm, onClose, onCancel }: EnterE2EPasswordModalProps) => {
	const { t } = useTranslation();
	const {
		handleSubmit,
		control,
		setFocus,
		formState: { errors },
	} = useForm({
		defaultValues: {
			password: '',
		},
	});

	const passwordInputId = useId();

	useEffect(() => {
		setFocus('password');
	}, [setFocus]);

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(({ password }) => onConfirm(password))} {...props} />}
			variant='warning'
			title={t('Enter_E2E_password')}
			icon='warning'
			cancelText={t('Do_It_Later')}
			confirmText={t('Enable_encryption')}
			onClose={onClose}
			onCancel={onCancel}
		>
			<Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_password_request_text')) }} />
			<FieldGroup mbs={24} w='full'>
				<Field>
					<FieldRow>
						<Controller
							name='password'
							control={control}
							rules={{ required: t('Invalid_pass') }}
							render={({ field, fieldState: { error, invalid } }) => (
								<PasswordInput
									{...field}
									error={error?.message}
									aria-invalid={invalid ? 'true' : 'false'}
									aria-required='true'
									aria-describedby={error ? `${passwordInputId}-error` : undefined}
									placeholder={t('Please_enter_E2EE_password')}
								/>
							)}
						/>
					</FieldRow>
					{errors.password && (
						<FieldError id={`${passwordInputId}-error`} role='alert'>
							{errors.password.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default EnterE2EPasswordModal;
