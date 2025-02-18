import type { IUser, Serialized } from '@rocket.chat/core-typings';
import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';

import UsersTableRow from './UsersTableRow';
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

const UsersTable = ({ workspace = 'local' }): ReactElement => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const directRoute = useRoute('direct');
	const federation = workspace === 'external';
	const [text, setText] = useState('');
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'email' | 'origin' | 'createdAt'>('name');

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				mediaQuery && canViewFullOtherUserInfo && (
					<GenericTableHeaderCell
						key='email'
						direction={sortDirection}
						active={sortBy === 'email'}
						onClick={setSort}
						sort='email'
						width='x200'
					>
						{t('Email')}
					</GenericTableHeaderCell>
				),
				federation && (
					<GenericTableHeaderCell
						key='origin'
						direction={sortDirection}
						active={sortBy === 'origin'}
						onClick={setSort}
						sort='origin'
						width='x200'
					>
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
						width='x200'
					>
						{t('Joined_at')}
					</GenericTableHeaderCell>
				),
			].filter(Boolean),
		[setSort, sortBy, sortDirection, t, mediaQuery, canViewFullOtherUserInfo, federation],
	);

	const query = useDirectoryQuery({ text, current, itemsPerPage }, [sortBy, sortDirection], 'users', workspace);
	const getDirectoryData = useEndpoint('GET', '/v1/directory');

	const { data, isFetched, isLoading, isError, refetch } = useQuery({
		queryKey: ['getDirectoryData', query],
		queryFn: () => getDirectoryData(query),
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
							{data?.result.map((user) => (
								<UsersTableRow
									key={user._id}
									onClick={handleClick}
									mediaQuery={mediaQuery}
									user={user as unknown as Serialized<IUser>}
									federation={federation}
									canViewFullOtherUserInfo={canViewFullOtherUserInfo}
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

export default UsersTable;
