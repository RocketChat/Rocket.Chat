import { Box, PasswordInput, TextInput, FieldGroup, Field, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';

type ActionConfirmModalProps = {
	isPassword: boolean;
	onConfirm: (input: string, setInputError: (message: string) => void) => void;
	onCancel: () => void;
};

// TODO: Use react-hook-form
const ActionConfirmModal = ({ isPassword, onConfirm, onCancel }: ActionConfirmModalProps) => {
	const { t } = useTranslation();
	const actionTextId = useId();
	const inputId = useId();
	const errorId = `${inputId}-error`;

	const {
		control,
		handleSubmit,
		setError,
		setFocus,
		formState: { errors },
	} = useForm<{ credential: string}>({
		defaultValues: { credential: '' },
		mode: 'onBlur',
	});

	const handleSave = handleSubmit(({ credential }) =>{
		onConfirm(credential, (message) =>{
			if (message) {
				setError( 'credential', { message });
				setFocus('credential');
			}
		});
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSave} {...props} />}
			onClose={onCancel}
			onConfirm={handleSave}
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
							rules={{ required: t('Invalid_field') }}
							render={({ field }) => 
								isPassword ? (
									<PasswordInput
										{...field}
										id={inputId}
										aria-labelledby={actionTextId}
										aria-describedby={errors.credential ? errorId : undefined}
										aria-invalid={Boolean(errors.credential)}
										aria-required="true"									
									/>
								) : (
									<TextInput
										{...field}
										id={inputId}
										placeholder={t('Username')}
										aria-labelledby={actionTextId}
										aria-describedby={errors.credential ? errorId : undefined}
										aria-invalid={Boolean(errors.credential)}
										aria-required="true"
									/>
								)
							}
						/>
					</FieldRow>
					{errors.credential && (
						<FieldError aria-live="assertive" id={errorId}>{errors.credential.message}</FieldError>
					)}

				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ActionConfirmModal;
