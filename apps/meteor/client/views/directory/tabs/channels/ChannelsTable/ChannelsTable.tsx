import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import ChannelsTableRow from './ChannelsTableRow';
import FilterByText from '../../../../../components/FilterByText';
import GenericNoResults from '../../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../components/GenericTable/hooks/useSort';
import { useDirectoryQuery } from '../../../hooks/useDirectoryQuery';

const ChannelsTable = () => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 768px)');
	const [text, setText] = useState('');

	const channelRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount' | 'lastMessage' | 'createdAt'>('name');

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell
					key='usersCount'
					direction={sortDirection}
					active={sortBy === 'usersCount'}
					onClick={setSort}
					sort='usersCount'
					w='100px'
				>
					{t('Users')}
				</GenericTableHeaderCell>,
				mediaQuery && (
					<GenericTableHeaderCell
						key='createdAt'
						direction={sortDirection}
						active={sortBy === 'createdAt'}
						onClick={setSort}
						sort='createdAt'
						w='150px'
					>
						{t('Created_at')}
					</GenericTableHeaderCell>
				),
				mediaQuery && (
					<GenericTableHeaderCell
						key='lastMessage'
						direction={sortDirection}
						active={sortBy === 'lastMessage'}
						onClick={setSort}
						sort='lastMessage'
						w='150px'
					>
						{t('Last_Message')}
					</GenericTableHeaderCell>
				),
				mediaQuery && (
					<GenericTableHeaderCell key='belongsTo' w='150px'>
						{t('Belongs_To')}
					</GenericTableHeaderCell>
				),
			].filter(Boolean),
		[setSort, sortBy, t, sortDirection, mediaQuery],
	);

	const getDirectoryData = useEndpoint('GET', '/v1/directory');
	const query = useDirectoryQuery({ text, current, itemsPerPage }, [sortBy, sortDirection], 'channels');
	const { data, isFetched, isLoading, isError, refetch } = useQuery({
		queryKey: ['getDirectoryData', query],
		queryFn: () => getDirectoryData(query),
	});

	const onClick = useMemo(
		() => (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => {
			if (name && (e.type === 'click' || (e as KeyboardEvent).key === 'Enter')) {
				type === 'c' ? channelRoute.push({ name }) : groupsRoute.push({ name });
			}
		},
		[channelRoute, groupsRoute],
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Channels')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && isFetched && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.result.map((room) => (
								<ChannelsTableRow key={room._id} room={room as Serialized<IRoom>} onClick={onClick} mediaQuery={mediaQuery} />
							))}
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
			{isFetched && data?.result.length === 0 && <GenericNoResults />}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default ChannelsTable;
