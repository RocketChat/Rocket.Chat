import React, { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Table } from '@rocket.chat/fuselage';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import GenericTable from '../../components/GenericTable';
import FilterByText from '../../components/FilterByText';

const useQuery = ({ text, itemsPerPage, current }, [column, direction], userIdLoggedIn) => useMemo(() => ({
	sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
	open: false,
	roomName: text,
	agents: [userIdLoggedIn],
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [column, current, direction, itemsPerPage, userIdLoggedIn, text]);

const ChatTable = () => {
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'desc']);
	const t = useTranslation();
	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const userIdLoggedIn = Meteor.userId();
	const query = useQuery(debouncedParams, debouncedSort, userIdLoggedIn);

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

	const { data } = useEndpointDataExperimental('livechat/rooms', query) || {};

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'fname'} direction={sort[1]} active={sort[0] === 'fname'} onClick={onHeaderClick} sort='fname'>{t('Contact_Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'department'} direction={sort[1]} active={sort[0] === 'department'} onClick={onHeaderClick} sort='department'>{t('Department')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts'>{t('Started_At')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'chatDuration'} direction={sort[1]} active={sort[0] === 'chatDuration'} onClick={onHeaderClick} sort='chatDuration'>{t('Chat_Duration')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'closedAt'} direction={sort[1]} active={sort[0] === 'closedAt'} onClick={onHeaderClick} sort='closedAt'>{t('Closed_At')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, fname, ts, closedAt, department }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{fname}</Table.Cell>
		<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(closedAt).diff(moment(ts), 'minutes')} {t('Minutes')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(closedAt).format('L LTS')}</Table.Cell>
	</Table.Row>, [t]);

	return <GenericTable
		header={header}
		renderRow={renderRow}
		results={data && data.rooms}
		total={data && data.total}
		setParams={setParams}
		params={params}
		renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
	/>;
};


export default function ChatTab(props) {
	return <ChatTable {...props} />;

	// return <NotAuthorizedPage />;
}
