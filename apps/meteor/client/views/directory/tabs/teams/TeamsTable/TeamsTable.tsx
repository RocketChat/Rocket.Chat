import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useMemo, useState } from 'react';

import TeamsTableRow from './TeamsTableRow';
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

const TeamsTable = () => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 768px)');
	const [text, setText] = useState('');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'usersCount' | 'lastMessage' | 'createdAt'>('name');

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				<GenericTableHeaderCell key='channelsCount' w='100px'>
					{t('Channels')}
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
			].filter(Boolean),
		[setSort, sortBy, sortDirection, t, mediaQuery],
	);

	const channelsRoute = useRoute('channel');
	const groupsRoute = useRoute('group');

	const getDirectoryData = useEndpoint('GET', '/v1/directory');
	const query = useDirectoryQuery({ text, current, itemsPerPage }, [sortBy, sortDirection], 'teams');
	const { data, isFetched, isLoading, isError, refetch } = useQuery({
		queryKey: ['getDirectoryData', query],
		queryFn: () => getDirectoryData(query),
	});

	const onClick = useMemo(
		() => (name: IRoom['name'], type: IRoom['t']) => (e: KeyboardEvent | MouseEvent) => {
			if (name && (e.type === 'click' || (e as KeyboardEvent).key === 'Enter')) {
				type === 'c' ? channelsRoute.push({ name }) : groupsRoute.push({ name });
			}
		},
		[channelsRoute, groupsRoute],
	);

	return (
		<>
			<FilterByText placeholder={t('Teams_Search_teams')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && isFetched && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.result.map((team) => (
								<TeamsTableRow
									key={team._id}
									team={team as unknown as Serialized<IRoom> & { roomsCount: number }}
									onClick={onClick}
									mediaQuery={mediaQuery}
								/>
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

export default TeamsTable;
