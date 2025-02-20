import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, hashKey } from '@tanstack/react-query';
import { useState, useMemo } from 'react';

import { CallTableRow } from './CallTableRow';
import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';

const CallTable = () => {
	const t = useTranslation();
	const userIdLoggedIn = useUserId();

	const [text, setText] = useState('');
	const directoryRoute = useRoute('omnichannel-directory');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'phone' | 'queue' | 'ts' | 'callDuration' | 'direction'>('fname');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				open: 'false' as const,
				roomName: text || '',
				agents: userIdLoggedIn ? [userIdLoggedIn] : [],
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[sortBy, current, sortDirection, itemsPerPage, userIdLoggedIn, text],
		),
		500,
	);

	const onRowClick = useEffectEvent((id: string, token?: string) => {
		directoryRoute.push(
			{
				tab: 'calls',
				context: 'info',
				id,
			},
			token ? { token } : {},
		);
	});

	const getVoipRooms = useEndpoint('GET', '/v1/voip/rooms');
	const { data, isSuccess, isLoading } = useQuery({
		queryKey: ['voip-rooms', query],
		queryFn: async () => getVoipRooms(query),
	});

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='fname' direction={sortDirection} active={sortBy === 'fname'} onClick={setSort} sort='fname' w='x400'>
				{t('Contact_Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='phone' direction={sortDirection} active={sortBy === 'phone'} onClick={setSort} sort='phone' w='x200'>
				{t('Phone')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='queue' direction={sortDirection} active={sortBy === 'queue'} onClick={setSort} sort='ts' w='x100'>
				{t('Queue')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts' w='x200'>
				{t('Started_At')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='callDuration'
				direction={sortDirection}
				active={sortBy === 'callDuration'}
				onClick={setSort}
				sort='callDuration'
				w='x120'
			>
				{t('Talk_Time')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='direction'
				direction={sortDirection}
				active={sortBy === 'direction'}
				onClick={setSort}
				sort='direction'
				w='x200'
			>
				{t('Direction')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='call' width={44} />
		</>
	);

	return (
		<>
			{((isSuccess && data?.rooms.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={headers.props.children.filter(Boolean).length} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.rooms.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.rooms.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='phone'
					title={t('No_calls_yet')}
					description={t('No_calls_yet_description')}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_voice_channel')}
				/>
			)}
			{isSuccess && data?.rooms.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.rooms.map((room) => <CallTableRow key={room._id} room={room} onRowClick={onRowClick} />)}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default CallTable;
