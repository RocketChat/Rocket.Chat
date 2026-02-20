import { Box, PasswordInput, TextInput, FieldGroup, Field, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type ActionConfirmModalProps = {
	isPassword: boolean;
	onConfirm: (input: string) => Promise<void>;
	onCancel: () => void;
};

const ActionConfirmModal = ({ isPassword, onConfirm, onCancel }: ActionConfirmModalProps) => {
	const { t } = useTranslation();
	const actionTextId = useId();
	const credentialFieldId = useId();
	const credentialFieldError = `${credentialFieldId}-error`;

	const {
		control,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm({
		defaultValues: { credential: '' },
		mode: 'onBlur',
	});

	const handleSave = async ({ credential }: { credential: string }) => {
		try {
			await onConfirm(credential);
		} catch (error: any) {
			if (error.errorType === 'error-invalid-password') {
				setError('credential', { message: t('Invalid_password') }, { shouldFocus: true });
			}
		}
	};

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleSave)} {...props} />}
			onCancel={onCancel}
			variant='danger'
			title={t('Delete_account?')}
			confirmText={t('Delete_account')}
		>
			<Box mb={8} id={actionTextId}>
				{isPassword ? t('Enter_your_password_to_delete_your_account') : t('Enter_your_username_to_delete_your_account')}
			</Box>
			<FieldGroup w='full'>
				<Field>
					<FieldRow>
						<Controller
							name='credential'
							control={control}
							rules={{ required: t('error-the-field-is-required', { field: isPassword ? t('Password') : t('Username') }) }}
							render={({ field }) =>
								isPassword ? (
									<PasswordInput
										{...field}
										id={credentialFieldId}
										aria-labelledby={actionTextId}
										aria-describedby={errors.credential ? credentialFieldError : undefined}
										aria-invalid={Boolean(errors.credential)}
										aria-required='true'
									/>
								) : (
									<TextInput
										{...field}
										id={credentialFieldId}
										placeholder={t('Username')}
										aria-labelledby={actionTextId}
										aria-describedby={errors.credential ? credentialFieldError : undefined}
										aria-invalid={Boolean(errors.credential)}
										aria-required='true'
									/>
								)
							}
						/>
					</FieldRow>
					{errors.credential && (
						<FieldError role='alert' id={credentialFieldError}>
							{errors.credential.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ActionConfirmModal;
