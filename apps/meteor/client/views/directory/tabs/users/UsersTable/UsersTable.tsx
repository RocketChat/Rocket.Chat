import type { IDirectoryUserResult, IUser, Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
	usePaginatedQuery,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { usePermission, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import UsersTableRow from './UsersTableRow';
import FilterByText from '../../../../../components/FilterByText';
import { useDirectoryQuery } from '../../../hooks/useDirectoryQuery';

export type UsersTableProps = {
	workspace?: 'external' | 'local';
};

const UsersTable = ({ workspace = 'local' }: UsersTableProps) => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const directRoute = useRoute('direct');
	const federation = workspace === 'external';
	const [text, setText] = useState('');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'email' | 'origin' | 'createdAt'>('name');

	const columns: TableColumnWidth[] = [
		'auto',
		...(mediaQuery && canViewFullOtherUserInfo ? (['x200'] as const) : []),
		...(federation ? (['x200'] as const) : []),
		...(mediaQuery ? (['x200'] as const) : []),
	];

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				mediaQuery && canViewFullOtherUserInfo && (
					<GenericTableHeaderCell key='email' direction={sortDirection} active={sortBy === 'email'} onClick={setSort} sort='email'>
						{t('Email')}
					</GenericTableHeaderCell>
				),
				federation && (
					<GenericTableHeaderCell key='origin' direction={sortDirection} active={sortBy === 'origin'} onClick={setSort} sort='origin'>
						{t('Domain')}
					</GenericTableHeaderCell>
				),
				mediaQuery && (
					<GenericTableHeaderCell
						key='createdAt'
						direction={sortDirection}
						active={sortBy === 'createdAt'}
						onClick={setSort}
						sort='createdAt'
					>
						{t('Joined_at')}
					</GenericTableHeaderCell>
				),
			].filter(Boolean),
		[setSort, sortBy, sortDirection, t, mediaQuery, canViewFullOtherUserInfo, federation],
	);

	const query = useDirectoryQuery({ text }, [sortBy, sortDirection], 'users', workspace);
	const getDirectoryData = useEndpoint('GET', '/v1/directory');

	const { data, isFetched, isLoading, isError, refetch, paginationProps } = usePaginatedQuery({
		query,
		queryKey: ['getDirectoryData', query],
		queryFn: getDirectoryData,
		itemsKey: 'result',
	});

	const handleClick = useCallback(
		(username: IUser['username']) => (e: KeyboardEvent | MouseEvent) => {
			if (!username) return;
			if (e.type === 'click' || (e as KeyboardEvent).key === 'Enter') {
				directRoute.push({ rid: username });
			}
		},
		[directRoute],
	);

	return (
		<>
			<FilterByText placeholder={t('Search_Users')} value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && isFetched && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.result.map((user) => (
								<UsersTableRow
									key={user._id}
									onClick={handleClick}
									mediaQuery={mediaQuery}
									user={user as unknown as Serialized<IDirectoryUserResult>}
									federation={federation}
									canViewFullOtherUserInfo={canViewFullOtherUserInfo}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
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

export default UsersTable;
