import { UserStatus } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableRow,
	GenericTableCell,
	GenericTableLoadingRow,
	usePaginatedQuery,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import { QueueListFilter } from './QueueListFilter';

const QueueListTable = () => {
	const t = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'servedBy' | 'department' | 'total' | 'status'>('servedBy');

	const [filters, setFilters] = useState<{
		servedBy: string;
		status: string;
		departmentId: string;
	}>({
		servedBy: '',
		status: '',
		departmentId: '',
	});

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = (
		<>
			{mediaQuery && (
				<GenericTableHeaderCell key='servedBy' direction={sortDirection} active={sortBy === 'servedBy'} onClick={setSort} sort='servedBy'>
					{t('Served_By')}
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell
				key='department'
				direction={sortDirection}
				active={sortBy === 'department'}
				onClick={setSort}
				sort='department'
			>
				{t('Department')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='total' direction={sortDirection} active={sortBy === 'total'} onClick={setSort} sort='total'>
				{t('Total')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='status' direction={sortDirection} active={sortBy === 'status'} onClick={setSort} sort='status'>
				{t('Status')}
			</GenericTableHeaderCell>
		</>
	);

	const query = useMemo(() => {
		const query: {
			agentId?: string;
			includeOfflineAgents?: 'true' | 'false';
			departmentId?: string;
			sort: string;
		} = {
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
		};

		if (filters.status !== 'online') {
			query.includeOfflineAgents = 'true';
		}
		if (filters.servedBy) {
			query.agentId = filters.servedBy;
		}
		if (filters.departmentId) {
			query.departmentId = filters.departmentId;
		}

		return query;
	}, [sortBy, sortDirection, filters.status, filters.departmentId, filters.servedBy]);

	const getUserStatus = (status?: string) => {
		if (!status) {
			return t('Offline');
		}

		switch (status) {
			case UserStatus.ONLINE:
				return t('Online');
			case UserStatus.AWAY:
				return t('Away');
			case UserStatus.BUSY:
				return t('Busy');
			case UserStatus.OFFLINE:
				return t('Offline');
			default:
				return status;
		}
	};

	const getLivechatQueue = useEndpoint('GET', '/v1/livechat/queue');
	const { data, isSuccess, isLoading, paginationProps } = usePaginatedQuery({
		query,
		getQueryKey: (query) => ['livechat-queue', query],
		queryFn: getLivechatQueue,
		itemsKey: 'queue',
	});

	return (
		<>
			<QueueListFilter setFilter={setFilters} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.queue.length === 0 && <GenericNoResults />}
			{isSuccess && data?.queue.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.queue.map(({ user, department, chats }) => (
								<GenericTableRow key={user._id} tabIndex={0}>
									<GenericTableCell truncate>
										<Box display='flex' alignItems='center' marginBlock='x4'>
											<UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={user.username} />
											<Box display='flex' marginInline={8}>
												{user.username}
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell truncate>{department ? department.name : ''}</GenericTableCell>
									<GenericTableCell truncate>{chats}</GenericTableCell>
									<GenericTableCell truncate>{getUserStatus(user?.status)}</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
		</>
	);
};

export default QueueListTable;
