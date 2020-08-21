

import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';
import { Table, Icon } from '@rocket.chat/fuselage';
import moment from 'moment';
import { FlowRouter } from 'meteor/kadira:flow-router';


import { Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useMethod } from '../../contexts/ServerContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import { useRoute } from '../../contexts/RouterContext';
import CurrentChatsPage from './CurrentChatsPage';

export function RemoveCurrentChatButton({ _id, reload }) {
	const removeCurrentChat = useMethod('livechat:removeCurrentChat');
	const currentChatsRoute = useRoute('omnichannel-currentChats');


	const handleRemoveClick = useMutableCallback(async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await removeCurrentChat(_id);
		} catch (error) {
			console.log(error);
		}
		currentChatsRoute.push({});
		reload();
	});

	return <Table.Cell fontScale='p1' color='hint' onClick={handleRemoveClick} withTruncatedText><Icon name='trash' size='x20'/></Table.Cell>;
}

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ guest, servedBy, department, status, from, to, itemsPerPage, current }, [column, direction]) => useMemo(() => {
	const query = {
		roomName: guest,
		sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
		...itemsPerPage && { count: itemsPerPage },
		...current && { offset: current },
	};

	if (from && to) {
		query.createdAt = JSON.stringify({ start: from, end: to });
	}
	if (status !== 'all') {
		query.open = status === 'open';
	}
	if (servedBy && servedBy.length > 0) {
		query.agents = servedBy;
	}
	if (department && department.length > 0) {
		console.log(department);
		query.departmentId = department;
	}

	console.log(query);
	return query;
}, [guest, servedBy, department, from, to, status, column, direction, itemsPerPage, current]);

function CurrentChatsRoute() {
	const t = useTranslation();
	const canViewCurrentChats = usePermission('view-livechat-current-chats');

	const [params, setParams] = useState({ fname: '', servedBy: [], status: '', department: '', from: '', to: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

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

	const { data, reload } = useEndpointDataExperimental('livechat/rooms', query) || {};
	const { data: departments } = useEndpointDataExperimental('livechat/department', query) || {};

	console.log(data, departments);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name' w='x120'>{t('Name')}</Th>,
		<Th key={'departmentId'} direction={sort[1]} active={sort[0] === 'departmentId'} onClick={onHeaderClick} sort='departmentId' w='x200'>{t('Department')}</Th>,
		<Th key={'servedBy'} direction={sort[1]} active={sort[0] === 'servedBy'} onClick={onHeaderClick} sort='servedBy' w='x120'>{t('Served_by')}</Th>,
		<Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' w='x120'>{t('Started_at')}</Th>,
		<Th key={'lm'} direction={sort[1]} active={sort[0] === 'lm'} onClick={onHeaderClick} sort='visibility' w='x120'>{t('Last_message')}</Th>,
		<Th key={'status'} direction={sort[1]} active={sort[0] === 'status'} onClick={onHeaderClick} sort='status' w='x120'>{t('Status')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, fname, servedBy, ts, lm, department, open }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{fname}{_id}</Table.Cell>
		<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
		<Table.Cell withTruncatedText>{servedBy && servedBy.username}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(lm).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{open ? t('Open') : t('Closed')}</Table.Cell>
	</Table.Row>, [onRowClick, t]);

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
		departments={departments}
		title={'Current Chats'}>
	</CurrentChatsPage>;
}

export default CurrentChatsRoute;
