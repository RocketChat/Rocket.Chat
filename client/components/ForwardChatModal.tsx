import React, { FC, useCallback, useEffect, useRef } from 'react';
import { Field, Button, TextAreaInput, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../contexts/TranslationContext';
import { useForm } from '../hooks/useForm';
// import { useComponentDidUpdate } from '../hooks/useComponentDidUpdate';
import ModalSeparator from './ModalSeparator';
import DepartmentAutoComplete from '../views/omnichannel/DepartmentAutoComplete';
import { UserAutoComplete } from './AutoComplete';

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

	const { values, handlers } = useForm({ departmentName: '', userId: '', comment: '' });

	const { departmentName, userId, comment } = values as { departmentName: string; userId: string; comment: string };
	const { handleDepartmentName, handleUserId, handleComment } = handlers;

	const handleSend = useCallback(() => {
		onForward(departmentName, userId, comment);
	}, [onForward, departmentName, userId, comment]);


	const onChangeDepartment = (departmentId: string): void => {
		handleDepartmentName(departmentId);
		handleUserId('');
	};

	const onChangeUserId = (userId: string): void => {
		handleUserId(userId);
		handleDepartmentName('');
	};

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
					<UserAutoComplete flexGrow={1} value={userId} onChange={onChangeUserId} placeholder={t('Username')} />
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
