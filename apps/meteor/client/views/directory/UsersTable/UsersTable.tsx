import { Pagination, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useDirectoryQuery } from '../hooks/useDirectoryQuery';
import UsersTableRow from './UsersTableRow';

const UsersTable = ({ workspace = 'local' }): ReactElement => {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const [text, setText] = useState('');
	const directRoute = useRoute('direct');
	const federation = workspace === 'external';
	const debouncedText = useDebouncedValue(text, 500);
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'email' | 'origin' | 'createdAt'>('name');

	const headers = useMemo(
		() =>
			[
				<GenericTableHeaderCell key={'name'} direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
					{t('Name')}
				</GenericTableHeaderCell>,
				mediaQuery && canViewFullOtherUserInfo && (
					<GenericTableHeaderCell
						key={'email'}
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

	const query = useDirectoryQuery({ text: debouncedText, current, itemsPerPage }, [sortBy, sortDirection], 'users', workspace);
	const { value: data, phase } = useEndpointData('/v1/directory', query);

	const handleClick = useCallback(
		(username) => (e: React.KeyboardEvent | React.MouseEvent) => {
			if (e.type === 'click' || (e as React.KeyboardEvent).key === 'Enter') {
				directRoute.push({ rid: username });
			}
		},
		[directRoute],
	);

	return (
		<>
			<FilterByText autoFocus placeholder={t('Search_Users')} onChange={({ text }): void => setText(text)} />
			{phase === AsyncStatePhase.LOADING && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={5} />}</GenericTableBody>
				</GenericTable>
			)}
			{data?.result && data.result.length > 0 && phase === AsyncStatePhase.RESOLVED && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.result.map((user) => (
								<UsersTableRow
									key={user._id}
									onClick={handleClick}
									mediaQuery={mediaQuery}
									user={user}
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
			{phase === AsyncStatePhase.RESOLVED && data?.result.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
		</>
	);
};

export default UsersTable;
