import { UserStatus } from '@rocket.chat/core-typings';
import { Box, Pagination } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { QueueListFilter } from './QueueListFilter';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableRow,
	GenericTableCell,
	GenericTableLoadingRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';

const QueueListTable = (): ReactElement => {
	const t = useTranslation();
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
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
			count: number;
		} = {
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
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
	}, [sortBy, sortDirection, itemsPerPage, current, filters.status, filters.departmentId, filters.servedBy]);

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
	const { data, isSuccess, isLoading } = useQuery({
		queryKey: ['livechat-queue', query],
		queryFn: async () => getLivechatQueue(query),
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
									<GenericTableCell withTruncatedText>
										<Box display='flex' alignItems='center' mb='5px'>
											<UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={user.username} />
											<Box display='flex' mi={8}>
												{user.username}
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{department ? department.name : ''}</GenericTableCell>
									<GenericTableCell withTruncatedText>{chats}</GenericTableCell>
									<GenericTableCell withTruncatedText>{getUserStatus(user?.status)}</GenericTableCell>
								</GenericTableRow>
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
		</>
	);
};

export default QueueListTable;
