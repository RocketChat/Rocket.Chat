import { ButtonGroup, Button, Box, Icon, PasswordInput, TextInput, Modal } from '@rocket.chat/fuselage';
import React, { useState, useCallback, FC } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

type ActionConfirmModalProps = {
	title: string;
	text: string;
	isPassword: boolean;
	onSave: (input: string) => void;
	onCancel: () => void;
};

const ActionConfirmModal: FC<ActionConfirmModalProps> = ({
	title,
	text,
	isPassword,
	onSave,
	onCancel,
	...props
}) => {
	const t = useTranslation();
	const [inputText, setInputText] = useState('');

	const handleChange = useCallback((e) => setInputText(e.currentTarget.value), [setInputText]);
	const handleSave = useCallback(() => { onSave(inputText); onCancel(); }, [inputText, onSave, onCancel]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mb='x8'>{text}</Box>
			{isPassword && <PasswordInput w='full' value={inputText} onChange={handleChange}/>}
			{!isPassword && <TextInput w='full' value={inputText} onChange={handleChange}/>}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={handleSave}>{t('Continue')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default ActionConfirmModal;
