import type { IModerationAuditLog } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import {
	GenericTable,
	GenericTableLoadingTable,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableHeader,
	GenericTableRow,
	GenericTableCell,
	usePagination,
	useSort,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const ModerationAuditLogsTable = () => {
	const { t } = useTranslation();
	const formatDateTime = useFormatDateAndTime();

	const { sortBy, sortDirection, setSort } = useSort<'ts' | 'action' | 'moderator.username' | 'targetUser.username'>('ts');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useMemo(
		() => ({
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			count: itemsPerPage,
			offset: current,
		}),
		[current, itemsPerPage, sortBy, sortDirection],
	);

	const getAuditLogs = useEndpoint('GET', '/v1/moderation.auditLogs');

	const { data, isLoading, isSuccess } = useQuery({
		queryKey: ['moderation', 'auditLogs', 'fetchAll', query],
		queryFn: async () => getAuditLogs(query),
		meta: {
			apiErrorToastMessage: true,
		},
		placeholderData: keepPreviousData,
	});

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
				{t('Date_and_time')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='action' direction={sortDirection} active={sortBy === 'action'} onClick={setSort} sort='action'>
				{t('Action')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key='targetUser'
				direction={sortDirection}
				active={sortBy === 'targetUser.username'}
				onClick={setSort}
				sort='targetUser.username'
			>
				{t('Target_User')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='accountAge'>{t('Account_Age')}</GenericTableHeaderCell>,
			<GenericTableHeaderCell
				key='moderator'
				direction={sortDirection}
				active={sortBy === 'moderator.username'}
				onClick={setSort}
				sort='moderator.username'
			>
				{t('Moderator')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key='reason'>{t('Reason')}</GenericTableHeaderCell>,
		],
		[sortDirection, sortBy, setSort, t],
	);

	const formatAccountAge = (ageInSeconds: number): string => {
		if (ageInSeconds < 60) {
			return `${ageInSeconds}s`;
		}
		const minutes = Math.floor(ageInSeconds / 60);
		if (minutes < 60) {
			return `${minutes}m`;
		}
		const hours = Math.floor(minutes / 60);
		if (hours < 24) {
			return `${hours}h`;
		}
		const days = Math.floor(hours / 24);
		return `${days}d`;
	};

	const formatAction = (action: IModerationAuditLog['action']): string => {
		switch (action) {
			case 'deactivate':
				return t('Deactivated');
			case 'mute':
				return t('Muted');
			case 'flag':
				return t('Flagged');
			case 'dismiss':
				return t('Dismissed');
			default:
				return action;
		}
	};

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>{isLoading && <GenericTableLoadingTable headerCells={headers.length} />}</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.logs.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.logs.map((log) => (
								<GenericTableRow key={log._id}>
									<GenericTableCell>{formatDateTime(log.ts)}</GenericTableCell>
									<GenericTableCell>{formatAction(log.action)}</GenericTableCell>
									<GenericTableCell>{log.targetUser.username}</GenericTableCell>
									<GenericTableCell>{formatAccountAge(log.targetAccountAge)}</GenericTableCell>
									<GenericTableCell>{log.moderator.username}</GenericTableCell>
									<GenericTableCell>{log.reason || t('No_reason_provided')}</GenericTableCell>
								</GenericTableRow>
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
			{isSuccess && data.logs.length === 0 && <GenericNoResults />}
		</>
	);
};

export default ModerationAuditLogsTable;
