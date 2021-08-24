import {
	Field,
	Button,
	TextAreaInput,
	Icon,
	ButtonGroup,
	Modal,
	Box,
	PaginatedSelectFiltered,
} from '@rocket.chat/fuselage';
import { useMutableCallback, useAutoFocus, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { useEndpoint } from '../../../contexts/ServerContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useForm } from '../../../hooks/useForm';
import ModalSeparator from '../../ModalSeparator';
import UserAutoComplete from '../../UserAutoComplete';
import { useDepartmentsList } from '../hooks/useDepartmentsList';

const ForwardChatModal = ({ onForward, onCancel, room, ...props }) => {
	const t = useTranslation();

	const inputRef = useAutoFocus(true);

	const { values, handlers } = useForm({
		username: '',
		comment: '',
		department: {},
	});
	const { username, comment, department } = values;
	const [userId, setUserId] = useState('');

	const { handleUsername, handleComment, handleDepartment } = handlers;
	const getUserData = useEndpoint('GET', `users.info?username=${username}`);

	const [departmentsFilter, setDepartmentsFilter] = useState('');

	const debouncedDepartmentsFilter = useDebouncedValue(departmentsFilter, 500);

	const { itemsList: departmentsList, loadMoreItems: loadMoreDepartments } = useDepartmentsList(
		useMemo(() => ({ filter: debouncedDepartmentsFilter }), [debouncedDepartmentsFilter]),
	);

	const {
		phase: departmentsPhase,
		items: departmentsItems,
		itemCount: departmentsTotal,
	} = useRecordList(departmentsList);

	const handleSend = useMutableCallback(() => {
		onForward(department?.value, userId, comment);
	}, [onForward, department.value, userId, comment]);

	const onChangeUsername = useMutableCallback((username) => {
		handleUsername(username);
	});

	useEffect(() => {
		if (!username) {
			return;
		}
		const fetchData = async () => {
			const { user } = await getUserData();
			setUserId(user._id);
		};
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [username]);

	const canForward = department || username;

	const departments = departmentsItems;

	const hasDepartments = departments && departments.length > 0;

	const { servedBy: { _id: agentId } = {} } = room || {};

	const _id = agentId && { $ne: agentId };

	const conditions = { _id, status: { $ne: 'offline' }, statusLivechat: 'available' };

	return (
		<Modal {...props}>
			<Modal.Header>
				<Icon name='baloon-arrow-top-right' size={20} />
				<Modal.Title>{t('Forward_chat')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content fontScale='p1'>
				<Field mbe={'x30'}>
					<Field.Label>{t('Forward_to_department')}</Field.Label>
					<Field.Row>
						<PaginatedSelectFiltered
							withTitle
							filter={departmentsFilter}
							setFilter={setDepartmentsFilter}
							options={departmentsItems}
							value={department}
							maxWidth='100%'
							placeholder={t('Select_an_option')}
							onChange={handleDepartment}
							flexGrow={1}
							endReached={
								departmentsPhase === AsyncStatePhase.LOADING
									? () => {}
									: (start) => loadMoreDepartments(start, Math.min(50, departmentsTotal))
							}
						/>
					</Field.Row>
				</Field>
				<ModalSeparator text={t('or')} />
				<Field mbs={hasDepartments && 'x30'}>
					<Field.Label>{t('Forward_to_user')}</Field.Label>
					<Field.Row>
						<UserAutoComplete
							conditions={conditions}
							flexGrow={1}
							value={username}
							onChange={onChangeUsername}
							placeholder={t('Username')}
						/>
					</Field.Row>
				</Field>
				<Field marginBlock='x15'>
					<Field.Label>
						{t('Leave_a_comment')}{' '}
						<Box is='span' color='neutral-600'>
							({t('Optional')})
						</Box>
					</Field.Label>
					<Field.Row>
						<TextAreaInput
							ref={inputRef}
							rows={8}
							flexGrow={1}
							value={comment}
							onChange={handleComment}
						/>
					</Field.Row>
				</Field>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button disabled={!canForward} primary onClick={handleSend}>
						{t('Forward')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default ForwardChatModal;
