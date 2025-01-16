import type { IUser } from '@rocket.chat/core-typings';
import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ModConsoleUserTableRow from './ModConsoleUserTableRow';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableLoadingTable,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableHeader,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import ModerationFilter from '../helpers/ModerationFilter';

const ModConsoleUsersTable = () => {
	const [text, setText] = useState('');
	const router = useRouter();
	const { t } = useTranslation();
	const isDesktopOrLarger = useMediaQuery('(min-width: 1024px)');

	const { sortBy, sortDirection, setSort } = useSort<
		'reports.ts' | 'reports.reportedUser.username' | 'reports.reportedUser.createdAt' | 'count'
	>('reports.ts');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
		start: '',
		end: '',
	});
	const { start, end } = dateRange;

	const query = useDebouncedValue(
		useMemo(
			() => ({
				selector: text,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
				count: itemsPerPage,
				offset: current,
				latest: end ? `${new Date(end).toISOString().slice(0, 10)}T23:59:59.999Z` : undefined,
				oldest: start ? `${new Date(start).toISOString().slice(0, 10)}T00:00:00.000Z` : undefined,
			}),
			[current, end, itemsPerPage, sortBy, sortDirection, start, text],
		),
		500,
	);

	const getReports = useEndpoint('GET', '/v1/moderation.userReports');

	const { data, isLoading, isSuccess, isError, refetch } = useQuery({
		queryKey: ['moderation', 'userReports', 'fetchAll', query],
		queryFn: () => getReports(query),
		placeholderData: keepPreviousData,
	});

	const handleClick = useEffectEvent((id: IUser['_id']): void => {
		router.navigate({
			pattern: '/admin/moderation/:tab?/:context?/:id?',
			params: { tab: 'users', context: 'info', id },
		});
	});

	const headers = (
		<>
			<GenericTableHeaderCell
				key='name'
				direction={sortDirection}
				active={sortBy === 'reports.reportedUser.username'}
				onClick={setSort}
				sort='reports.reportedUser.username'
			>
				{t('User')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				active={sortBy === 'reports.reportedUser.createdAt'}
				onClick={setSort}
				sort='reports.reportedUser.createdAt'
				key='created'
				direction={sortDirection}
			>
				{t('Created_at')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='email' direction={sortDirection}>
				{t('Email')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='postdate' direction={sortDirection} active={sortBy === 'reports.ts'} onClick={setSort} sort='reports.ts'>
				{t('Moderation_Report_date')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='reports' direction={sortDirection} active={sortBy === 'count'} onClick={setSort} sort='count'>
				{t('Moderation_Reports')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='actions' width='x48' />
		</>
	);

	return (
		<>
			<ModerationFilter text={text} setText={setText} setDateRange={setDateRange} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{isLoading && <GenericTableLoadingTable headerCells={6} />}</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.reports.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.reports.map((report) => (
								<ModConsoleUserTableRow
									key={report.reportedUser?._id}
									report={report}
									onClick={handleClick}
									isDesktopOrLarger={isDesktopOrLarger}
								/>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						current={current}
						divider
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data.reports.length === 0 && <GenericNoResults />}
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

export default ModConsoleUsersTable;
