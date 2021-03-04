import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Field, Button, TextInput, TextAreaInput, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useForm } from '../hooks/useForm';
import { useComponentDidUpdate } from '../hooks/useComponentDidUpdate';


type ForwardChatModalProps = {
	onForward: (departmentName: string, username: string, comment?: string) => void;
	onCancel: () => void;
};

const ForwardChatModal: FC<ForwardChatModalProps> = ({ onForward, onCancel, ...props }) => {
	const t = useTranslation();

	const ref = useRef<HTMLInputElement>();

	useEffect(() => {
		if (typeof ref?.current?.focus === 'function') {
			ref.current.focus();
		}
	}, [ref]);

	const { values, handlers } = useForm({ departmentName: '', username: '', commend: '' });

	const { departmentName, username, comment } = values as { departmentName: string; username: string; comment: string };
	const { handleDepartmentName, handleUsername, handleComment } = handlers;
	const [departmentError, setDepartmentError] = useState('');
	const [usernameError, setUsernameError] = useState('');


	const handleSend = useCallback(() => {
		onForward(departmentName, username, comment);
	}, [onForward, departmentName, username, comment]);

	useComponentDidUpdate(() => {
		setDepartmentError(!departmentName ? t('The_field_is_required', t('Department')) : '');
	}, [t, departmentName]);

	useComponentDidUpdate(() => {
		setUsernameError(!username ? t('The_field_is_required', t('Username')) : '');
	}, [t, username]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='baloon-arrow-top-right' size={20}/>
			<Modal.Title>{t('Transcript')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Field>
				<Field.Label>{t('Forward_to_department')}*</Field.Label>
				<Field.Row>
					<TextInput ref={ref} error={departmentError} flexGrow={1} value={departmentName} onChange={handleDepartmentName} />
				</Field.Row>
				<Field.Error>
					{departmentError}
				</Field.Error>
			</Field>
			<p>or</p>
			<Field>
				<Field.Label>{t('Forward_to_user')}*</Field.Label>
				<Field.Row>
					<TextInput error={usernameError} flexGrow={1} value={username} onChange={handleUsername} />
				</Field.Row>
				<Field.Error>
					{usernameError}
				</Field.Error>
			</Field>
			<Field>
				<Field.Label>{t('Leave_a_comment')}*</Field.Label>
				<Field.Row>
					<TextAreaInput rows={3} flexGrow={1} value={comment} onChange={handleComment} />
				</Field.Row>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary onClick={handleSend}>{t('Forward')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default ForwardChatModal;
