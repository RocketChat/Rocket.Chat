import type { AbacAttributeDefinitionChangeType, AbacActionPerformed } from '@rocket.chat/core-typings';
import { Box, InputBox, Pagination } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	usePaginatedQuery,
	usePagination,
	GenericNoResults,
	useFormatDateAndTime,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterBar, FilterBarFilters } from '../../../../components/FilterBar';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import DateRangePicker, { type DateRangePreset } from '../../moderation/helpers/DateRangePicker';

const LogsPage = () => {
	const { t } = useTranslation();

	const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
	const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
	const [preset, setPreset] = useState<DateRangePreset | null>('today');

	const formatDate = useFormatDateAndTime();

	const getLogs = useEndpoint('GET', '/v1/abac/audit');

	type LogsData = Awaited<ReturnType<typeof getLogs>>;

	type MappedLogEvent = {
		id: string;
		user: string;
		userId?: string;
		timestamp: Date;
		element: string;
		action: string;
		room: string | undefined;
		name?: string;
	} | null;

	type CombinedLogs = {
		data:
			| {
					events: MappedLogEvent[];
					count: number;
					offset: number;
					total: number;
			  }
			| undefined;
		isLoading: boolean;
	};

	const query = useMemo(
		() => ({
			...(startDate && { start: new Date(`${startDate}T00:00:00.000`).toISOString() }),
			...(endDate && { end: new Date(`${endDate}T23:59:59.999`).toISOString() }),
		}),
		[startDate, endDate],
	);

	const queryKey = ABACQueryKeys.logs.list(query);
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination({ resetKey: queryKey });

	const getActionLabel = useCallback(
		(action?: AbacAttributeDefinitionChangeType | AbacActionPerformed | null) => {
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
		},
		[t],
	);

	const combineLogs = useCallback(
		(results: UseQueryResult<LogsData>[]): CombinedLogs => {
			type LogEvent = LogsData['events'][number];
			type EventInfo = Omit<NonNullable<MappedLogEvent>, 'name'>;

			const getEventInfo = (event: LogEvent): EventInfo => ({
				id: event._id,
				user: event.actor?.type === 'user' ? event.actor.username : t('System'),
				...(event.actor?.type === 'user' && { userId: event.actor._id }),
				timestamp: new Date(event.ts),
				element: t('ABAC_Room'),
				action: getActionLabel(event.data?.find((item) => item.key === 'change')?.value),
				room: undefined,
			});

			const mapAttributeChanged = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.attribute.changed') return null;

				return {
					...info,
					element: t('ABAC_Room_Attribute'),
					name: event.data?.find((item) => item.key === 'attributeKey')?.value ?? '',
				};
			};

			const mapActionPerformed = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.action.performed') return null;

				return {
					...info,
					name: event.data?.find((item) => item.key === 'subject')?.value?.username ?? '',
					action: getActionLabel(event.data?.find((item) => item.key === 'action')?.value),
					room: event.data?.find((item) => item.key === 'object')?.value?.name ?? '',
					element: t('ABAC_room_membership'),
				};
			};

			const mapObjectAttributeChanged = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.object.attribute.changed') return null;

				const app = event.data?.find((item) => item.key === 'app')?.value;

				return {
					...info,
					...(app && {
						user: t('ABAC_User_via_App', {
							username: info.user,
							appName: app.name ?? app._id,
						}),
					}),
					name:
						event.data
							?.find((item) => item.key === 'current')
							?.value?.map((item) => item.key)
							.join(', ') ?? t('Empty'),
					room: event.data?.find((item) => item.key === 'room')?.value?.name ?? '',
				};
			};

			const mapObjectAttributesRemoved = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.object.attributes.removed') return null;

				return {
					...info,
					name:
						event.data
							?.find((item) => item.key === 'current')
							?.value?.map((item) => item.key)
							.join(', ') ?? t('Empty'),
					room: event.data?.find((item) => item.key === 'room')?.value?.name ?? '',
				};
			};

			const mapAttributeStoreSwitched = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.attribute.store.switched') return null;

				return {
					...info,
					element: t('ABAC_Attribute_Store'),
					action: t('ABAC_Attribute_Store_Switched'),
					name: `${event.data?.find((item) => item.key === 'from')?.value} -> ${event.data?.find((item) => item.key === 'to')?.value}`,
					room: t('ABAC_Rooms_Affected', {
						count: Number(event.data?.find((item) => item.key === 'roomsAffected')?.value ?? 0),
					}),
				};
			};

			const mapMembershipEvaluated = (event: LogEvent, info: EventInfo): MappedLogEvent => {
				if (event.t !== 'abac.membership.evaluated') return null;

				return {
					...info,
					element: t('ABAC_room_membership'),
					action: t('ABAC_Membership_Evaluated'),
					name:
						event.data
							?.find((item) => item.key === 'subjects')
							?.value?.map((item) => item.username)
							.join(', ') ?? '',
				};
			};

			const mapLogEvent = (event: LogEvent): MappedLogEvent => {
				const info = getEventInfo(event);

				switch (event.t) {
					case 'abac.attribute.changed':
						return mapAttributeChanged(event, info);
					case 'abac.action.performed':
						return mapActionPerformed(event, info);
					case 'abac.object.attribute.changed':
						return mapObjectAttributeChanged(event, info);
					case 'abac.object.attributes.removed':
						return mapObjectAttributesRemoved(event, info);
					case 'abac.attribute.store.switched':
						return mapAttributeStoreSwitched(event, info);
					case 'abac.membership.evaluated':
						return mapMembershipEvaluated(event, info);
					default:
						return null;
				}
			};

			const pages = results.flatMap((result) => (result.data ? [result.data] : []));

			const logs =
				pages.length === results.length
					? pages.slice(1).reduce(
							(acc, page) => ({
								...acc,
								events: [...acc.events, ...page.events],
								count: acc.events.length + page.events.length,
							}),
							pages[0],
						)
					: undefined;

			const data = logs && {
				events: logs.events.map(mapLogEvent),
				count: logs.count,
				offset: logs.offset,
				total: logs.total,
			};

			return {
				data,
				isLoading: results.some((result) => result.isLoading),
			};
		},
		[getActionLabel, t],
	);

	const { data, isLoading } = usePaginatedQuery({
		query: {
			queryKey,
			queryFn: (page) => getLogs({ ...query, ...page }),
		},
		combine: combineLogs,
		offset: current,
		count: itemsPerPage,
	});

	return (
		<>
			<FilterBar>
				<FilterBarFilters>
					<InputBox
						type='date'
						placeholder={t('Start_date')}
						value={startDate}
						onChange={(e) => {
							setStartDate((e.target as HTMLInputElement).value);
							setPreset(null);
						}}
					/>
					<InputBox
						type='date'
						placeholder={t('End_date')}
						value={endDate}
						onChange={(e) => {
							setEndDate((e.target as HTMLInputElement).value);
							setPreset(null);
						}}
					/>
					<DateRangePicker
						defaultSelectedKey='today'
						value={preset}
						onPresetChange={setPreset}
						onChange={(range) => {
							setStartDate(range.start);
							setEndDate(range.end);
						}}
					/>
				</FilterBarFilters>
			</FilterBar>
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
										<GenericTableCell truncate title={eventInfo.user}>
											{eventInfo.userId && (
												<Box is='span' marginInlineEnd={4}>
													<UserAvatar size='x28' userId={eventInfo.userId} />
												</Box>
											)}
											{eventInfo.user}
										</GenericTableCell>
										<GenericTableCell truncate>{eventInfo.action}</GenericTableCell>
										<GenericTableCell truncate>{eventInfo.room}</GenericTableCell>
										<GenericTableCell truncate>{eventInfo.element}</GenericTableCell>
										<GenericTableCell truncate title={eventInfo.name}>
											{eventInfo.name}
										</GenericTableCell>
										<GenericTableCell truncate>{formatDate(eventInfo.timestamp)}</GenericTableCell>
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
