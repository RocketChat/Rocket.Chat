import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Field, Button, TextAreaInput, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../contexts/TranslationContext';
import { useForm } from '../hooks/useForm';
import ModalSeparator from './ModalSeparator';
import DepartmentAutoComplete from '../views/omnichannel/DepartmentAutoComplete';
import { UserAutoComplete } from './AutoComplete';
import { useEndpointAction } from '../hooks/useEndpointAction';

type ForwardChatModalProps = {
	onForward: (departmentName?: string, userId?: string, comment?: string) => void;
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

	const { values, handlers } = useForm({ departmentName: '', username: '', comment: '' });
	const { departmentName, username, comment } = values as { departmentName: string; username: string; comment: string };
	const [userId, setUserId] = useState('');

	const { handleDepartmentName, handleUsername, handleComment } = handlers;
	const userInfo = useEndpointAction('GET', `users.info?username=${ username }`);


	const handleSend = useCallback(() => {
		onForward(departmentName, userId, comment);
	}, [onForward, departmentName, userId, comment]);


	const onChangeDepartment = useMutableCallback((departmentId: string): void => {
		handleDepartmentName(departmentId);
		handleUsername('');
		setUserId('');
	});

	const onChangeUsername = useMutableCallback((username: string): void => {
		handleUsername(username);
		handleDepartmentName('');
	});

	useEffect(() => {
<<<<<<< HEAD
=======
		console.log('Do something after counter has changed', username);
>>>>>>> new-quick-action-buttons
		if (!username) { return; }
		const fetchData = async (): Promise<void> => {
			const { user } = await userInfo();
			setUserId(user._id);
		};
		fetchData();
	}, [username]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='baloon-arrow-top-right' size={20}/>
			<Modal.Title>{t('Forward_chat')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Field mbe={'x30'}>
				<Field.Label>{t('Forward_to_department')}</Field.Label>
				<Field.Row>
					<DepartmentAutoComplete value={departmentName} onChange={onChangeDepartment} flexShrink={1} placeholder={t('Department_name')} />
				</Field.Row>
			</Field>
			<ModalSeparator text={t('or')} />
			<Field mbs={'x30'}>
				<Field.Label>{t('Forward_to_user')}</Field.Label>
				<Field.Row>
					<UserAutoComplete flexGrow={1} value={username} onChange={onChangeUsername} placeholder={t('Username')} />
				</Field.Row>
			</Field>
			<Field marginBlock='x15'>
				<Field.Label>{t('Leave_a_comment')}</Field.Label>
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
