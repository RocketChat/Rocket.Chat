import React, { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Table } from '@rocket.chat/fuselage';
import moment from 'moment';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import GenericTable from '../../components/GenericTable';
import FilterByText from '../../components/FilterByText';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ guest, servedBy, department, from, to, tags, customFields, itemsPerPage, current }, [column, direction]) => useMemo(() => {
	const query = {
		...guest && { roomName: guest },
		sort: JSON.stringify({ [column]: sortDir(direction), ts: column === 'ts' ? sortDir(direction) : undefined }),
		open: false,
		...itemsPerPage && { count: itemsPerPage },
		...current && { offset: current },
	};

	return query;
}, [guest, column, direction, itemsPerPage, current, from, to, servedBy, department, tags, customFields]);

const ChatTable = () => {
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['username', 'asc']);
	const t = useTranslation();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const { data } = useEndpointDataExperimental('livechat/rooms', query) || {};

	const header = useMemo(() => [
		<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'departmentId'} direction={sort[1]} active={sort[0] === 'departmentId'} onClick={onHeaderClick} sort='departmentId'>{t('Department')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'servedBy'} direction={sort[1]} active={sort[0] === 'servedBy'} onClick={onHeaderClick} sort='servedBy'>{t('Served_By')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts'>{t('Started_At')}</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell key={'lm'} direction={sort[1]} active={sort[0] === 'lm'} onClick={onHeaderClick} sort='lm'>{t('Last_Message')}</GenericTable.HeaderCell>,
	].filter(Boolean), [sort, onHeaderClick, t]);

	const renderRow = useCallback(({ _id, fname, servedBy, ts, lm, department }) => <Table.Row key={_id} tabIndex={0} role='link' action qa-user-id={_id}>
		<Table.Cell withTruncatedText>{fname}</Table.Cell>
		<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
		<Table.Cell withTruncatedText>{servedBy && servedBy.username}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
		<Table.Cell withTruncatedText>{moment(lm).format('L LTS')}</Table.Cell>
	</Table.Row>, []);

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
