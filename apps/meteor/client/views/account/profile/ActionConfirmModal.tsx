import { Box, PasswordInput, TextInput, FieldGroup, Field, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ChangeEvent } from 'react';
import { useState, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

type ActionConfirmModalProps = {
	isPassword: boolean;
	onConfirm: (input: string) => void;
	onCancel: () => void;
};

// TODO: Use react-hook-form
const ActionConfirmModal = ({ isPassword, onConfirm, onCancel }: ActionConfirmModalProps) => {
	const { t } = useTranslation();
	const [inputText, setInputText] = useState('');
	const [inputError, setInputError] = useState<string | undefined>();

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			e.target.value !== '' && setInputError(undefined);
			setInputText(e.currentTarget.value);
		},
		[setInputText],
	);

	const handleSave = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			e.preventDefault();
			if (inputText === '') {
				setInputError(t('Invalid_field'));
				return;
			}
			onConfirm(inputText);
			onCancel();
		},
		[inputText, onConfirm, onCancel, t],
	);

	const actionTextId = useId();
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
						{isPassword && <PasswordInput value={inputText} onChange={handleChange} aria-labelledby={actionTextId} />}
						{!isPassword && <TextInput value={inputText} onChange={handleChange} aria-labelledby={actionTextId} />}
					</FieldRow>
					<FieldError>{inputError}</FieldError>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ActionConfirmModal;
