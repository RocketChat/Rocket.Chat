import type { AbacAttributeDefinitionChangeType, AbacActionPerformed } from '@rocket.chat/core-typings';
import { Box, InputBox, Margins, Pagination } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../../../components/GenericNoResults';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import DateRangePicker from '../../moderation/helpers/DateRangePicker';

const LogsPage = () => {
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

	const getActionLabel = (action?: AbacAttributeDefinitionChangeType | AbacActionPerformed | null) => {
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
			case 'revoked-object-access':
				return t('ABAC_Revoked_Object_Access');
			case 'granted-object-access':
				return t('ABAC_Granted_Object_Access');
			default:
				return '';
		}
	};

	const { data, isLoading } = useQuery({
		queryKey: ABACQueryKeys.logs.list(query),
		queryFn: () => getLogs(query),
		select: (data) => ({
			events: data.events.map((event) => {
				const eventInfo = {
					id: event._id,
					user: event.actor?.type === 'user' ? event.actor.username : t('System'),
					...(event.actor?.type === 'user' && { userAvatar: <UserAvatar size='x28' userId={event.actor._id} /> }),
					timestamp: new Date(event.ts),
					element: t('ABAC_Room'),
					action: getActionLabel(event.data?.find((item) => item.key === 'change')?.value),
					room: undefined,
				};
				switch (event.t) {
					case 'abac.attribute.changed':
						return {
							...eventInfo,
							element: t('ABAC_Room_Attribute'),
							name: event.data?.find((item) => item.key === 'attributeKey')?.value ?? '',
						};
					case 'abac.action.performed':
						return {
							...eventInfo,
							name: event.data?.find((item) => item.key === 'subject')?.value?.username ?? '',
							action: getActionLabel(event.data?.find((item) => item.key === 'action')?.value),
							room: event.data?.find((item) => item.key === 'object')?.value?.name ?? '',
							element: t('ABAC_room_membership'),
						};
					case 'abac.object.attribute.changed':
					case 'abac.object.attributes.removed':
						return {
							...eventInfo,
							name:
								event.data
									?.find((item) => item.key === 'current')
									?.value?.map((item) => item.key)
									.join(', ') ?? t('Empty'),
							room: event.data?.find((item) => item.key === 'room')?.value?.name ?? '',
						};
					default:
						return null;
				}
			}),
			count: data.count,
			offset: data.offset,
			total: data.total,
		}),
	});

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
							defaultSelectedKey='today'
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
							<GenericTableHeaderCell>{t('Room')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Element')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('ABAC_Element_Name')}</GenericTableHeaderCell>
							<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{data?.events.map((eventInfo) => {
								if (!eventInfo) {
									return null;
								}
								return (
									<GenericTableRow key={eventInfo.id}>
										<GenericTableCell withTruncatedText>
											{eventInfo.userAvatar && (
												<Box is='span' mie={4}>
													{eventInfo.userAvatar}
												</Box>
											)}
											{eventInfo.user}
										</GenericTableCell>
										<GenericTableCell withTruncatedText>{eventInfo.action}</GenericTableCell>
										<GenericTableCell withTruncatedText>{eventInfo.room}</GenericTableCell>
										<GenericTableCell withTruncatedText>{eventInfo.element}</GenericTableCell>
										<GenericTableCell withTruncatedText title={eventInfo.name}>
											{eventInfo.name}
										</GenericTableCell>
										<GenericTableCell withTruncatedText>{formatDate(eventInfo.timestamp)}</GenericTableCell>
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

export default LogsPage;
