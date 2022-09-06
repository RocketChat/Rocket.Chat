import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { LivechatRoomsProps } from '@rocket.chat/rest-typings';
import { usePermission, useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';

import {
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { GenericTable } from '../../../components/GenericTable/V2/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import Page from '../../../components/Page';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import Chat from '../directory/chats/Chat';
import CustomFieldsVerticalBar from './CustomFieldsVerticalBar';
import FilterByText from './FilterByText';
import RemoveChatButton from './RemoveChatButton';
import { useAllCustomFields } from './useAllCustomFields';

type useQueryType = (
	debouncedParams: {
		fname: string;
		guest: string;
		servedBy: string;
		department: string;
		status: string;
		from: string;
		to: string;
		tags: any[];
		itemsPerPage: 25 | 50 | 100;
		current: number;
	},
	customFields: { [key: string]: string } | undefined,
	[column, direction]: [string, 'asc' | 'desc'],
) => LivechatRoomsProps | undefined;

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

const useQuery: useQueryType = (
	{ guest, servedBy, department, status, from, to, tags, itemsPerPage, current },
	customFields,
	[column, direction],
) =>
	useMemo(() => {
		const query: {
			agents?: string[];
			offset?: number;
			roomName?: string;
			departmentId?: string;
			open?: boolean;
			createdAt?: string;
			closedAt?: string;
			tags?: string[];
			onhold?: boolean;
			customFields?: string;
			sort: string;
			count?: number;
		} = {
			...(guest && { roomName: guest }),
			sort: JSON.stringify({
				[column]: sortDir(direction),
				ts: column === 'ts' ? sortDir(direction) : undefined,
			}),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		};

		if (from || to) {
			query.createdAt = JSON.stringify({
				...(from && {
					start: moment(new Date(from)).set({ hour: 0, minutes: 0, seconds: 0 }).format('YYYY-MM-DDTHH:mm:ss'),
				}),
				...(to && {
					end: moment(new Date(to)).set({ hour: 23, minutes: 59, seconds: 59 }).format('YYYY-MM-DDTHH:mm:ss'),
				}),
			});
		}

		if (status !== 'all') {
			query.open = status === 'opened' || status === 'onhold';
			query.onhold = status === 'onhold';
		}
		if (servedBy && servedBy !== 'all') {
			query.agents = [servedBy];
		}
		if (department && department !== 'all') {
			query.departmentId = department;
		}

		if (tags && tags.length > 0) {
			query.tags = tags;
		}

		if (customFields && Object.keys(customFields).length > 0) {
			const customFieldsQuery = Object.fromEntries(Object.entries(customFields).filter((item) => item[1] !== undefined && item[1] !== ''));
			if (Object.keys(customFieldsQuery).length > 0) {
				query.customFields = JSON.stringify(customFieldsQuery);
			}
		}

		return query;
	}, [guest, column, direction, itemsPerPage, current, from, to, status, servedBy, department, tags, customFields]);

const CurrentChatsRoute = (): ReactElement => {
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'departmentId' | 'servedBy' | 'ts' | 'lm' | 'open'>('ts', 'desc');
	const [customFields, setCustomFields] = useState<{ [key: string]: string }>();
	const [params, setParams] = useState({
		guest: '',
		fname: '',
		servedBy: '',
		status: '',
		department: '',
		from: '',
		to: '',
		current: 0,
		itemsPerPage: 25 as 25 | 50 | 100,
		tags: [] as string[],
	});
	const t = useTranslation();
	const id = useRouteParameter('id');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedCustomFields = useDebouncedValue(customFields, 500);

	const debouncedSort = useDebouncedValue(
		useMemo(() => [sortBy, sortDirection], [sortBy, sortDirection]),
		500,
	) as ['fname' | 'departmentId' | 'servedBy' | 'ts' | 'lm' | 'open', 'asc' | 'desc'];

	const query = useQuery(debouncedParams, debouncedCustomFields, debouncedSort);
	const canViewCurrentChats = usePermission('view-livechat-current-chats');
	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const directoryRoute = useRoute('omnichannel-current-chats');

	const { reload, ...result } = useEndpointData('/v1/livechat/rooms', query);
	const { data: allCustomFields } = useAllCustomFields();

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const hasCustomFields = useMemo(
		() => !!allCustomFields?.customFields?.find((customField) => customField.scope === 'room'),
		[allCustomFields],
	);

	const onRowClick = useMutableCallback((_id) => {
		directoryRoute.push({ id: _id });
	});

	const renderRow = useCallback(
		({ _id, fname, servedBy, ts, lm, department, open, onHold }) => {
			const getStatusText = (open: boolean, onHold: boolean): string => {
				if (!open) return t('Closed');
				return onHold ? t('On_Hold_Chats') : t('Open');
			};

			return (
				<GenericTableRow key={_id} onClick={(): void => onRowClick(_id)} action>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-name'>
						{fname}
					</GenericTableCell>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-department'>
						{department ? department.name : ''}
					</GenericTableCell>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-servedBy'>
						{servedBy?.username}
					</GenericTableCell>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-startedAt'>
						{moment(ts).format('L LTS')}
					</GenericTableCell>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-lastMessage'>
						{moment(lm).format('L LTS')}
					</GenericTableCell>
					<GenericTableCell withTruncatedText data-qa='current-chats-cell-status'>
						{getStatusText(open, onHold)}
					</GenericTableCell>
					{canRemoveClosedChats && !open && (
						<GenericTableCell withTruncatedText>
							<RemoveChatButton _id={_id} reload={reload} />
						</GenericTableCell>
					)}
				</GenericTableRow>
			);
		},
		[canRemoveClosedChats, onRowClick, reload, t],
	);

	if (!canViewCurrentChats) {
		return <NotAuthorizedPage />;
	}

	return id && id !== 'custom-fields' ? (
		<Chat rid={id} />
	) : (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Current_Chats')} />
				<Box pi='24px'>
					<FilterByText
						setFilter={setParams}
						setCustomFields={setCustomFields}
						customFields={customFields}
						hasCustomFields={hasCustomFields}
					/>
				</Box>
				<Page.Content>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell
								key='fname'
								direction={sortDirection}
								active={sortBy === 'fname'}
								onClick={setSort}
								sort='fname'
								data-qa='current-chats-header-name'
							>
								{t('Name')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='departmentId'
								direction={sortDirection}
								active={sortBy === 'departmentId'}
								onClick={setSort}
								sort='departmentId'
								data-qa='current-chats-header-department'
							>
								{t('Department')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='servedBy'
								direction={sortDirection}
								active={sortBy === 'servedBy'}
								onClick={setSort}
								sort='servedBy'
								data-qa='current-chats-header-servedBy'
							>
								{t('Served_By')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='ts'
								direction={sortDirection}
								active={sortBy === 'ts'}
								onClick={setSort}
								sort='ts'
								data-qa='current-chats-header-startedAt'
							>
								{t('Started_At')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='lm'
								direction={sortDirection}
								active={sortBy === 'lm'}
								onClick={setSort}
								sort='lm'
								data-qa='current-chats-header-lastMessage'
							>
								{t('Last_Message')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='open'
								direction={sortDirection}
								active={sortBy === 'open'}
								onClick={setSort}
								sort='open'
								w='x100'
								data-qa='current-chats-header-status'
							>
								{t('Status')}
							</GenericTableHeaderCell>
							{canRemoveClosedChats && (
								<GenericTableHeaderCell key='remove' w='x60' data-qa='current-chats-header-remove'>
									{t('Remove')}
								</GenericTableHeaderCell>
							)}
						</GenericTableHeader>
						<GenericTableBody data-qa='GenericTableCurrentChatsBody'>
							{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={4} />}
							{result.phase === AsyncStatePhase.RESOLVED && result.value.rooms.map((room) => renderRow({ ...room }))}
						</GenericTableBody>
					</GenericTable>
					{result.phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={result.value.total}
							onSetItemsPerPage={setItemsPerPage}
							onSetCurrent={setCurrent}
							{...paginationProps}
						/>
					)}
				</Page.Content>
			</Page>
			{id === 'custom-fields' && hasCustomFields && (
				<CustomFieldsVerticalBar setCustomFields={setCustomFields} allCustomFields={allCustomFields?.customFields || []} />
			)}
		</Page>
	);
};

export default memo(CurrentChatsRoute);
