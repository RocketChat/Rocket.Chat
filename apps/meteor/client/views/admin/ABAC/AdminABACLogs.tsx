import type { AbacAttributeDefinitionChangeType, Serialized } from '@rocket.chat/core-typings';
import { Box, InputBox, Margins, Pagination } from '@rocket.chat/fuselage';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';
import { ABACQueryKeys } from '../../../lib/queryKeys';
import DateRangePicker from '../moderation/helpers/DateRangePicker';

const AdminABACLogs = () => {
	const { t } = useTranslation();

	const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
	const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

	const formatDate = useFormatDateAndTime();

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const getLogs = useEndpoint('GET', '/v1/abac/audit');
	const query = useMemo(
		() => ({
			...(startDate && { start: new Date(`${startDate}T00:00:00.000Z`).toISOString() }),
			...(endDate && { end: new Date(`${endDate}T23:59:59.999Z`).toISOString() }),
			offset: current,
			count: itemsPerPage,
		}),
		[current, itemsPerPage, startDate, endDate],
	);

	// Whenever the user changes the filter or the text, reset the pagination to the first page
	useEffect(() => {
		setCurrent(0);
	}, [startDate, endDate, setCurrent]);

	const { data, isLoading } = useQuery({
		queryKey: ABACQueryKeys.logs.list(query),
		queryFn: () => getLogs(query),
	});

	const getActionLabel = (action?: AbacAttributeDefinitionChangeType | null) => {
		switch (action) {
			case 'created':
				return t('Created');
			case 'updated':
				return t('Updated');
			case 'deleted':
				return t('Deleted');
			case 'all-deleted':
				return t('ABAC_All_Attributes_deleted');
			case 'key-removed':
				return t('ABAC_Key_removed');
			case 'key-renamed':
				return t('ABAC_Key_renamed');
			case 'value-removed':
				return t('ABAC_Value_removed');
			case 'key-added':
				return t('ABAC_Key_added');
			case 'key-updated':
				return t('ABAC_Key_updated');
			default:
				return '';
		}
	};

	const getEventInfo = (
		event: Serialized<OperationResult<'GET', '/v1/abac/audit'>>['events'][number],
	): { element: string; userAvatar: ReactNode; user: string; name: string; action: string; timestamp: Date } => {
		if (event.t === 'abac.attribute.changed') {
			return {
				element: t('ABAC_Room_Attribute'),
				userAvatar: event.actor?.type === 'user' ? <UserAvatar size='x28' userId={event.actor._id} /> : null,
				user: event.actor?.type === 'user' ? event.actor.username : t('System'),
				name: event.data?.find((item) => item.key === 'attributeKey')?.value ?? '',
				action: getActionLabel(event.data?.find((item) => item.key === 'change')?.value),
				timestamp: new Date(event.ts),
			};
		}
		return {
			element: t('ABAC_Room'),
			userAvatar: event.actor?.type === 'user' ? <UserAvatar size='x28' userId={event.actor._id} /> : null,
			user: event.actor?.type === 'user' ? event.actor.username : t('System'),
			name: event.data?.find((item) => item.key === 'room')?.value?.name ?? '',
			action: getActionLabel(event.data?.find((item) => item.key === 'change')?.value),
			timestamp: new Date(event.ts),
		};
	};

	return (
		<>
			<Margins block={24}>
				<Box display='flex'>
					<InputBox
						type='date'
						placeholder={t('Start_date')}
						value={startDate}
						onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
					/>
					<Margins inlineStart={8}>
						<InputBox
							type='date'
							placeholder={t('End_date')}
							value={endDate}
							onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
						/>
					</Margins>
					<Margins inlineStart={8}>
						<DateRangePicker
							onChange={(range) => {
								setStartDate(range.start);
								setEndDate(range.end);
							}}
						/>
					</Margins>
				</Box>
			</Margins>
			{(!data || data.events?.length === 0) && !isLoading ? (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='extended-view' title={t('ABAC_No_logs')} description={t('ABAC_No_logs_description')} />
				</Box>
			) : (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell>{t('User')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Action')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Element')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Element_Name')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{data?.events?.map((event) => {
								const eventInfo = getEventInfo(event);
								return (
									<GenericTableRow key={event._id}>
										<GenericTableCell>
											<Box is='span' mie={4}>
												{eventInfo.userAvatar}
											</Box>
											{eventInfo.user}
										</GenericTableCell>
										<GenericTableCell>{eventInfo.action}</GenericTableCell>
										<GenericTableCell>{eventInfo.element}</GenericTableCell>
										<GenericTableCell>{eventInfo.name}</GenericTableCell>
										<GenericTableCell>{formatDate(eventInfo.timestamp)}</GenericTableCell>
									</GenericTableRow>
								);
							})}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default AdminABACLogs;
