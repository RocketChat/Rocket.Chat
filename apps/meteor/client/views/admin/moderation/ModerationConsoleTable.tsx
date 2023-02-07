import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { FC, MutableRefObject } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { sort } from 'semver';

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

	const { sortBy, sortDirection, setSort } = useSort<'ts' | 'u.username' | 'description'>('ts');
	const {
		current,
		itemsPerPage,
		currentItemsPerPage,
		onChangeItemsPerPage,
		setItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination();
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
		reload: reloadReports,
		isLoading,
		isSuccess,
		isError,
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

	console.log('data', data);

	// header sequence would be: name, reportedMessage, room, postdate, reports, actions
	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key={'name'} direction={sortDirection} active={sort === 'u.username'} onClick={setSort} sort='u.username'>
				Name
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key={'reportedMessage'}
				direction={sortDirection}
				active={sortBy === 'description'}
				onClick={setSort}
				sort='description'
			>
				Reported Message
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'room'} direction={sortDirection}>
				Room
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'postdate'} direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
				Post Date
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'reports'} direction={sortDirection}>
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
								<ModerationConsoleTableRow key={report._id} report={report} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						current={current}
						divider
						itemsPerPage={currentItemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onChangeItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default ModerationConsoleTable;
