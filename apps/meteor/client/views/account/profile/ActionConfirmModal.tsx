import { Box, PasswordInput, TextInput, FieldGroup, Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { useState, useCallback } from 'react';

import GenericModal from '../../../components/GenericModal';

type ActionConfirmModalProps = {
	isPassword: boolean;
	onConfirm: (input: string) => void;
	onCancel: () => void;
};

const ActionConfirmModal: FC<ActionConfirmModalProps> = ({ isPassword, onConfirm, onCancel }) => {
	const t = useTranslation();
	const [inputText, setInputText] = useState('');
	const [inputError, setInputError] = useState<string | undefined>();

	const handleChange = useCallback(
		(e) => {
			e.target.value !== '' && setInputError(undefined);
			setInputText(e.currentTarget.value);
		},
		[setInputText],
	);

	const handleSave = useCallback(
		(e) => {
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
			<Box mb={8}>{isPassword ? t('Enter_your_password_to_delete_your_account') : t('Enter_your_username_to_delete_your_account')}</Box>
			<FieldGroup w='full'>
				<Field>
					<Field.Row>
						{isPassword && <PasswordInput value={inputText} onChange={handleChange} />}
						{!isPassword && <TextInput value={inputText} onChange={handleChange} />}
					</Field.Row>
					<Field.Error>{inputError}</Field.Error>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ActionConfirmModal;
