import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableLoadingTable,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableHeader,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import ModerationConsoleTableRow from './ModerationConsoleTableRow';
import ModerationFilter from './helpers/ModerationFilter';

// TODO: Missing error state
const ModerationConsoleTable: FC = () => {
	const [text, setText] = useState('');
	const router = useRouter();
	const { t } = useTranslation();
	const isDesktopOrLarger = useMediaQuery('(min-width: 1024px)');

	const { sortBy, sortDirection, setSort } = useSort<'reports.ts' | 'reports.message.u.username' | 'reports.description' | 'count'>(
		'reports.ts',
	);
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
				...(end && { latest: `${new Date(end).toISOString().slice(0, 10)}T23:59:59.999Z` }),
				...(start && { oldest: `${new Date(start).toISOString().slice(0, 10)}T00:00:00.000Z` }),
			}),
			[current, end, itemsPerPage, sortBy, sortDirection, start, text],
		),
		500,
	);

	const getReports = useEndpoint('GET', '/v1/moderation.reportsByUsers');

	const dispatchToastMessage = useToastMessageDispatch();

	const { data, isLoading, isSuccess } = useQuery(['moderation', 'msgReports', 'fetchAll', query], async () => getReports(query), {
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		keepPreviousData: true,
	});

	const handleClick = useMutableCallback((id): void => {
		router.navigate({
			pattern: '/admin/moderation/:tab?/:context?/:id?',
			params: {
				tab: 'messages',
				context: 'info',
				id,
			},
		});
	});

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell
				key='name'
				direction={sortDirection}
				active={sortBy === 'reports.message.u.username'}
				onClick={setSort}
				sort='reports.message.u.username'
			>
				{t('User')}
			</GenericTableHeaderCell>,

			<GenericTableHeaderCell
				key='reportedMessage'
				direction={sortDirection}
				active={sortBy === 'reports.description'}
				onClick={setSort}
				sort='reports.description'
			>
				{t('Moderation_Reported_message')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='room' direction={sortDirection}>
				{t('Room')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='postdate' direction={sortDirection} active={sortBy === 'reports.ts'} onClick={setSort} sort='reports.ts'>
				{t('Moderation_Report_date')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='reports' direction={sortDirection} active={sortBy === 'count'} onClick={setSort} sort='count'>
				{t('Moderation_Reports')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='actions' width='x48' />,
		],
		[sortDirection, sortBy, setSort, t],
	);

	return (
		<>
			<ModerationFilter setText={setText} setDateRange={setDateRange} />
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
								<ModerationConsoleTableRow
									key={report.userId}
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
		</>
	);
};

export default ModerationConsoleTable;
