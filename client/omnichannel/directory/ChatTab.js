import React, { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Table, Tag, Box } from '@rocket.chat/fuselage';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import GenericTable from '../../components/GenericTable';
import FilterByText from '../../components/FilterByText';
import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';


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
	const [sort, setSort] = useState(['closedAt', 'desc']);
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
	});

	const { value: data } = useEndpointData('livechat/rooms', query);

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'fname'} direction={sort[1]} active={sort[0] === 'fname'} onClick={onHeaderClick} sort='fname' w='x400'>{t('Contact_Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'department'} direction={sort[1]} active={sort[0] === 'department'} onClick={onHeaderClick} sort='department' w='x200'>{t('Department')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' w='x200'>{t('Started_At')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'chatDuration'} direction={sort[1]} active={sort[0] === 'chatDuration'} onClick={onHeaderClick} sort='chatDuration' w='x120'>{t('Chat_Duration')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'closedAt'} direction={sort[1]} active={sort[0] === 'closedAt'} onClick={onHeaderClick} sort='closedAt' w='x200'>{t('Closed_At')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, fname, ts, closedAt, department, tags }) => <Table.Row key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
		<Table.Cell withTruncatedText>
			<Box display='flex' flexDirection='column'>
				<Box color='default' withTruncatedText>{fname}</Box>
				{tags && <Box color='hint' display='flex' flex-direction='row'>
					{tags.map((tag) => (
						<Box style={{ marginTop: 4, whiteSpace: 'nowrap', overflow: tag.length > 10 ? 'hidden' : 'visible', textOverflow: 'ellipsis' }} key={tag} mie='x4'>
							<Tag style={{ display: 'inline' }} disabled>{tag}</Tag>
						</Box>
					))}
				</Box>}
			</Box>
		</Table.Cell>
		<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(closedAt).from(moment(ts), true)}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(closedAt).format('L LTS')}</Table.Cell>
	</Table.Row>, [onRowClick]);

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
	const hasAccess = usePermission('view-l-room');

	if (hasAccess) {
		return <ChatTable {...props} />;
	}

	return <NotAuthorizedPage />;
}
