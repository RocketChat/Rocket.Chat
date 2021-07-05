import { Box, PasswordInput, TextInput, FieldGroup, Field } from '@rocket.chat/fuselage';
import React, { useState, useCallback, FC } from 'react';

import GenericModal from '../../components/GenericModal';
import { useTranslation } from '../../contexts/TranslationContext';

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

	const handleSave = useCallback(() => {
		if (inputText === '') {
			setInputError(t('Invalid_field'));
			return;
		}
		onConfirm(inputText);
		onCancel();
	}, [inputText, onConfirm, onCancel, t]);

	return (
		<GenericModal
			onClose={onCancel}
			onConfirm={handleSave}
			onCancel={onCancel}
			variant='danger'
			title={t('Are_you_sure_you_want_to_delete_your_account')}
			confirmText={t('Delete')}
		>
			<Box mb='x8'>
				{isPassword
					? t('For_your_security_you_must_enter_your_current_password_to_continue')
					: t('If_you_are_sure_type_in_your_username')}
			</Box>
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
