

import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon, Button } from '@rocket.chat/fuselage';
import moment from 'moment';
import { FlowRouter } from 'meteor/kadira:flow-router';


import GenericTable from '../../../components/GenericTable';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useMethod } from '../../../contexts/ServerContext';
import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import CurrentChatsPage from './CurrentChatsPage';
import DeleteWarningModal from '../../../components/DeleteWarningModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useEndpointData } from '../../../hooks/useEndpointData';

export function RemoveChatButton({ _id, reload }) {
	const removeChat = useMethod('livechat:removeRoom');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeChat(_id);
		} catch (error) {
			console.log(error);
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(<DeleteWarningModal
			onDelete={onDeleteAgent}
			onCancel={() => setModal()}
		/>);
	});

	return <Table.Cell fontScale='p1' color='hint'withTruncatedText>
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16'/>
		</Button>
	</Table.Cell>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ guest, servedBy, department, status, from, to, tags, customFields, itemsPerPage, current }, [column, direction]) => useMemo(() => {
	const query = {
		...guest && { roomName: guest },
		sort: JSON.stringify({ [column]: sortDir(direction), ts: column === 'ts' ? sortDir(direction) : undefined }),
		...itemsPerPage && { count: itemsPerPage },
		...current && { offset: current },
	};

	if (from && to) {
		query.createdAt = JSON.stringify({ start: from, end: to });
	}
	if (status !== 'all') {
		query.open = status === 'opened';
	}
	if (servedBy && servedBy !== 'all') {
		query.agents = [servedBy];
	}
	if (department && department !== 'all') {
		query.departmentId = department;
	}

	if (tags && tags.length > 0) {
		query.tags = tags;
	}

	if (customFields && Object.keys(customFields).length > 0) {
		query.customFields = JSON.stringify(customFields);
	}

	return query;
}, [guest, column, direction, itemsPerPage, current, from, to, status, servedBy, department, tags, customFields]);

function CurrentChatsRoute() {
	const t = useTranslation();
	const canViewCurrentChats = usePermission('view-livechat-current-chats');

	const [params, setParams] = useState({ fname: '', servedBy: [], status: '', department: '', from: '', to: '', customFields: {}, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['ts', 'desc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	// const livechatRoomRoute = useRoute('live/:id');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((_id) => {
		FlowRouter.go('live', { id: _id });
		// routing this way causes a 404 that only goes away with a refresh, need to fix in review
		// livechatRoomRoute.push({ id: _id });
	});

	const { value: data, reload } = useEndpointData('livechat/rooms', query);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'departmentId'} direction={sort[1]} active={sort[0] === 'departmentId'} onClick={onHeaderClick} sort='departmentId'>{t('Department')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'servedBy'} direction={sort[1]} active={sort[0] === 'servedBy'} onClick={onHeaderClick} sort='servedBy'>{t('Served_By')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts'>{t('Started_At')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'lm'} direction={sort[1]} active={sort[0] === 'lm'} onClick={onHeaderClick} sort='lm'>{t('Last_Message')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'status'} direction={sort[1]} active={sort[0] === 'status'} onClick={onHeaderClick} sort='status' w='x100'>{t('Status')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'remove'} w='x60'>{t('Remove')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, fname, servedBy, ts, lm, department, open }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{fname}</Table.Cell>
		<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
		<Table.Cell withTruncatedText>{servedBy && servedBy.username}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(lm).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{open ? t('Open') : t('Closed')}</Table.Cell>
		{!open && <RemoveChatButton _id={_id} reload={reload}/>}
	</Table.Row>, [onRowClick, reload, t]);

	if (!canViewCurrentChats) {
		return <NotAuthorizedPage />;
	}


	return <CurrentChatsPage
		setParams={setParams}
		params={params}
		onHeaderClick={onHeaderClick}
		data={data} useQuery={useQuery}
		reload={reload}
		header={header}
		renderRow={renderRow}
		title={t('Current_Chats')}>
	</CurrentChatsPage>;
}

export default CurrentChatsRoute;
