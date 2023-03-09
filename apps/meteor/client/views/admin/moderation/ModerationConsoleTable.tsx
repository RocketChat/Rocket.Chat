import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useRoute } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC, MutableRefObject } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import FilterByText from '../../../components/FilterByText';
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

const ModerationConsoleTable: FC<{ reload: MutableRefObject<() => void> }> = ({ reload }) => {
	const [text, setText] = useState('');
	const moderationRoute = useRoute('moderation-console');

	const { sortBy, sortDirection, setSort } = useSort<'reports.ts' | 'reports.message.u.username' | 'reports.description' | 'count'>(
		'reports.ts',
	);
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	// write a custom query to get the reports data from the database

	const query = useDebouncedValue(
		useMemo(
			() => ({
				selector: text,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
				count: itemsPerPage,
				offset: current,
			}),
			[current, itemsPerPage, sortBy, sortDirection, text],
		),
		500,
	);

	const getReports = useEndpoint('GET', '/v1/moderation.getReports');

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		data,
		refetch: reloadReports,
		isLoading,
		isSuccess,
	} = useQuery(
		['reports', query],
		async () => {
			const reports = await getReports(query);
			return reports;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = reloadReports;
	}, [reload, reloadReports]);

	const handleClick = useMutableCallback((id): void => {
		moderationRoute.push({
			context: 'info',
			id,
		});
	});

	// header sequence would be: name, reportedMessage, room, postdate, reports, actions
	const headers = useMemo(
		() => [
			<GenericTableHeaderCell
				key={'name'}
				direction={sortDirection}
				active={sortBy === 'reports.message.u.username'}
				onClick={setSort}
				sort='reports.message.u.username'
			>
				Name
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key={'reportedMessage'}
				direction={sortDirection}
				active={sortBy === 'reports.description'}
				onClick={setSort}
				sort='reports.description'
			>
				Reported Message
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'room'} direction={sortDirection}>
				Room
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key={'postdate'}
				direction={sortDirection}
				active={sortBy === 'reports.ts'}
				onClick={setSort}
				sort='reports.ts'
			>
				Post Date
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'reports'} direction={sortDirection} active={sortBy === 'count'} onClick={setSort} sort='count'>
				Reports
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'actions'} width={'5%'} />,
		],
		[sortDirection, setSort, sortBy],
	);

	return (
		<>
			{isLoading && <div>Loading...</div>}
			<FilterByText autoFocus placeholder={'Search'} onChange={({ text }): void => setText(text)} />
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
								<ModerationConsoleTableRow key={report.userId} report={report} onClick={handleClick} />
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
		</>
	);
};

export default ModerationConsoleTable;
