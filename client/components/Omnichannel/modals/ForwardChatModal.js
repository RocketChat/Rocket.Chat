import React, { useEffect, useMemo, useState } from 'react';
import { Field, Button, TextAreaInput, Icon, ButtonGroup, Modal, Box } from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';
import ModalSeparator from '../../ModalSeparator';
import DepartmentAutoComplete from '../../../views/omnichannel/DepartmentAutoComplete';
import { UserAutoComplete } from '../../AutoComplete';
import { useEndpoint } from '../../../contexts/ServerContext';
import { useEndpointData } from '../../../hooks/useEndpointData';

const ForwardChatModal = ({ onForward, onCancel, room, ...props }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);

	const { values, handlers } = useForm({ departmentName: '', username: '', comment: '' });
	const { departmentName, username, comment } = values;
	const [userId, setUserId] = useState('');

	const { handleDepartmentName, handleUsername, handleComment } = handlers;
	const getUserData = useEndpoint('GET', `users.info?username=${ username }`);
	const { value: departmentsData = {} } = useEndpointData('livechat/department', useMemo(() => ({ enabled: true }), []));

	const handleSend = useMutableCallback(() => {
		onForward(departmentName, userId, comment);
	}, [onForward, departmentName, userId, comment]);


	const onChangeDepartment = useMutableCallback((departmentId) => {
		handleDepartmentName(departmentId);
		handleUsername('');
		setUserId('');
	});

	const onChangeUsername = useMutableCallback((username) => {
		handleUsername(username);
		handleDepartmentName('');
	});

	useEffect(() => {
		if (!username) { return; }
		const fetchData = async () => {
			const { user } = await getUserData();
			setUserId(user._id);
		};
		fetchData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [username]);

	const canForward = departmentName || username;

	const { departments } = departmentsData;

	const hasDepartments = departments && departments.length > 0;

	const { servedBy: { _id: agentId } = {} } = room || {};

	const _id = agentId && { $ne: agentId };

	const conditions = { _id, status: { $ne: 'offline' }, statusLivechat: 'available' };

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='baloon-arrow-top-right' size={20}/>
			<Modal.Title>{t('Forward_chat')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{ hasDepartments && <>
				<Field mbe={'x30'}>
					<Field.Label>{t('Forward_to_department')}</Field.Label>
					<Field.Row>
						<DepartmentAutoComplete enabled={true} value={departmentName} onChange={onChangeDepartment} flexShrink={1} placeholder={t('Department_name')} />
					</Field.Row>
				</Field>
				<ModalSeparator text={t('or')} />
			</> }
			<Field mbs={hasDepartments && 'x30'}>
				<Field.Label>{t('Forward_to_user')}</Field.Label>
				<Field.Row>
					<UserAutoComplete conditions={conditions} flexGrow={1} value={username} onChange={onChangeUsername} placeholder={t('Username')} />
				</Field.Row>
			</Field>
			<Field marginBlock='x15'>
				<Field.Label>{t('Leave_a_comment')} <Box is='span' color='neutral-600'>({t('Optional')})</Box></Field.Label>
				<Field.Row>
					<TextAreaInput ref={inputRef} rows={8} flexGrow={1} value={comment} onChange={handleComment} />
				</Field.Row>
			</Field>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button disabled={!canForward} primary onClick={handleSend}>{t('Forward')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default ForwardChatModal;
