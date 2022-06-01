import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, useMemo, useEffect } from 'react';

import { GenericTable, GenericTableHeaderCell, GenericTableHeader, GenericTableBody } from '../../../../../client/components/GenericTable';
import { usePagination } from '../../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../client/components/GenericTable/hooks/useSort';
import DevicesRow from './DevicesRow';
import FilterByText from '/client/components/FilterByText';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';

const sortMapping = {
	clients: 'device.name',
	username: '_user.username',
	os: 'device.os.name',
	loginAt: 'loginAt',
};

const DevicesTable = (): ReactElement => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'clients' | 'os' | 'username' | 'loginAt'>('username');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				filter: text,
				sort: JSON.stringify({ [sortMapping[sortBy]]: sortDirection === 'asc' ? 1 : -1 }),
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection]
		),
		500,
	);

	const { value: data, phase, reload } = useEndpointData('sessions/list.all', query);

	useEffect(() => console.log("Query = ", query), [query]);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key={'clients'} direction={sortDirection} active={sortBy === 'clients'} onClick={setSort} sort='clients'>
				{t('Clients')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'os'} direction={sortDirection} active={sortBy === 'os'} onClick={setSort} sort='os'>
				{t('OS')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'username'} direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('User')}
			</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell key={'loginAt'} direction={sortDirection} active={sortBy === 'loginAt'} onClick={setSort} sort='loginAt'>
					{t('Last_login')}
				</GenericTableHeaderCell>
			),
			mediaQuery && (
				<GenericTableHeaderCell key={'_id'}>
					{t('Device_Id')}
				</GenericTableHeaderCell>
			),
			mediaQuery && (
				<GenericTableHeaderCell key={'ip'}>
					{t('IP_Address')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell width={'5%'} key='menu'>{' '}</GenericTableHeaderCell>
		],
		[t, mediaQuery],
	);

	if(!data) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
				<StatesIcon name='warning' variation='danger'/>
				<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
				<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={reload}>{t('Retry')}</StatesAction>
				</StatesActions>
				</States>
			</Box>
		);
	};

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<GenericTable>
				<GenericTableHeader>
					{headers}
				</GenericTableHeader>
				<GenericTableBody>
					{data?.sessions && data.sessions.map((session) => <DevicesRow key={session._id} {...session} />)}
				</GenericTableBody>
			</GenericTable>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetCurrent={setCurrent}
				onSetItemsPerPage={setItemsPerPage}
				{...paginationProps}
			/>
		</>
	);
};

export default DevicesTable;
