import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Callout, Pagination } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { GETLivechatRoomsParams } from '@rocket.chat/rest-typings';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import moment from 'moment';
import type { ComponentProps, ReactElement } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import CustomFieldsList from './CustomFieldsList';
import FilterByText from './FilterByText';
import RemoveChatButton from './RemoveChatButton';
import { useAllCustomFields } from './hooks/useAllCustomFields';
import { useCurrentChats } from './hooks/useCurrentChats';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useIsOverMacLimit } from '../../../hooks/omnichannel/useIsOverMacLimit';
import { RoomActivityIcon } from '../../../omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../omnichannel/hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../../omnichannel/priorities/PriorityIcon';

type DebouncedParams = {
	fname: string;
	guest: string;
	servedBy: string;
	department: string;
	status: string;
	from: string;
	to: string;
	tags: any[];
};

type CurrentChatQuery = {
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
	queued?: boolean;
};

type useQueryType = (
	debouncedParams: DebouncedParams,
	customFields: { [key: string]: string } | undefined,
	[column, direction]: [string, 'asc' | 'desc'],
	current: number,
	itemsPerPage: 25 | 50 | 100,
) => GETLivechatRoomsParams;

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

const currentChatQuery: useQueryType = (
	{ guest, servedBy, department, status, from, to, tags },
	customFields,
	[column, direction],
	current,
	itemsPerPage,
) => {
	const query: CurrentChatQuery = {
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
				start: moment(new Date(from)).set({ hour: 0, minutes: 0, seconds: 0 }).toISOString(),
			}),
			...(to && {
				end: moment(new Date(to)).set({ hour: 23, minutes: 59, seconds: 59 }).toISOString(),
			}),
		});
	}

	if (status !== 'all') {
		query.open = status === 'opened' || status === 'onhold' || status === 'queued';
		query.onhold = status === 'onhold';
		query.queued = status === 'queued';
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
};

const CurrentChatsPage = ({ id, onRowClick }: { id?: string; onRowClick: (_id: string) => void }): ReactElement => {
	const isWorkspaceOverMacLimit = useIsOverMacLimit();
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'departmentId' | 'servedBy' | 'priorityWeight' | 'ts' | 'lm' | 'open'>(
		'ts',
		'desc',
	);
	const [customFields, setCustomFields] = useState<{ [key: string]: string }>();

	const { t } = useTranslation();
	const directoryPath = useRouter().buildRoutePath('/omnichannel-directory');

	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const { data: allCustomFields } = useAllCustomFields();

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const [params, setParams] = useState({
		guest: '',
		fname: '',
		servedBy: '',
		status: 'all',
		department: '',
		from: '',
		to: '',
		tags: [] as string[],
	});

	const hasCustomFields = useMemo(
		() => !!allCustomFields?.customFields?.find((customField) => customField.scope === 'room'),
		[allCustomFields],
	);

	const query = useMemo(
		() => currentChatQuery(params, customFields, [sortBy, sortDirection], current, itemsPerPage),
		[customFields, itemsPerPage, params, sortBy, sortDirection, current],
	);

	const { data, isLoading, isSuccess } = useCurrentChats(query);

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const onFilter = useEffectEvent((params: DebouncedParams): void => {
		setParams(params);
		setCurrent(0);
	});

	const renderRow = useCallback(
		(room: IOmnichannelRoomWithDepartment) => {
			const { _id, fname, servedBy, ts, lm, department, open = false, onHold = false, priorityWeight } = room;
			const getStatusText = (open: boolean, onHold: boolean, servedBy: boolean): string => {
				if (!open) return t('Closed');
				if (open && !servedBy) return t('Queued');
				return onHold ? t('On_Hold_Chats') : t('Room_Status_Open');
			};

			return (
				<GenericTableRow key={_id} onClick={(): void => onRowClick(_id)} action data-qa-id={fname}>
					{isPriorityEnabled && (
						<GenericTableCell withTruncatedText data-qa='current-chats-cell-priority'>
							<PriorityIcon level={priorityWeight} />
						</GenericTableCell>
					)}
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
						<RoomActivityIcon room={room} /> {getStatusText(open, onHold, !!servedBy?.username)}
					</GenericTableCell>
					{canRemoveClosedChats && (
						<GenericTableCell maxHeight='x36' fontScale='p2' color='hint' withTruncatedText data-qa='current-chats-cell-delete'>
							{!open && <RemoveChatButton _id={_id} />}
						</GenericTableCell>
					)}
				</GenericTableRow>
			);
		},
		[canRemoveClosedChats, onRowClick, isPriorityEnabled, t],
	);

	const headers = (
		<>
			{isPriorityEnabled && (
				<GenericTableHeaderCell
					key='priorityWeight'
					direction={sortDirection}
					active={sortBy === 'priorityWeight'}
					onClick={setSort}
					sort='priorityWeight'
					w='x100'
					alignItems='center'
				>
					{t('Priority')}
				</GenericTableHeaderCell>
			)}
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
		</>
	);

	// TODO: Missing error state
	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Current_Chats')} />
				<PageContent>
					<Callout type='warning' title={t('This_page_will_be_deprecated_soon')}>
						<Trans i18nKey='Manage_conversations_in_the_contact_center'>
							Manage conversations in the
							<a href={directoryPath}>contact center</a>.
						</Trans>
					</Callout>
					{((isSuccess && data?.rooms.length > 0) || queryHasChanged) && (
						<FilterByText
							setFilter={onFilter as ComponentProps<typeof FilterByText>['setFilter']}
							setCustomFields={setCustomFields}
							customFields={customFields}
							hasCustomFields={hasCustomFields}
						/>
					)}
					{isWorkspaceOverMacLimit && (
						<Callout
							type='danger'
							icon='warning'
							title={t('The_workspace_has_exceeded_the_monthly_limit_of_active_contacts')}
							style={{ marginBlock: '2rem' }}
						>
							{t('Talk_to_your_workspace_admin_to_address_this_issue')}
						</Callout>
					)}
					{isSuccess && data?.rooms.length === 0 && queryHasChanged && <GenericNoResults />}
					{isSuccess && data?.rooms.length === 0 && !queryHasChanged && (
						<GenericNoResults
							icon='discussion'
							title={t('No_chats_yet')}
							description={t('No_chats_yet_description')}
							linkHref='https://go.rocket.chat/i/omnichannel-docs'
							linkText={t('Learn_more_about_current_chats')}
						/>
					)}
					{isLoading && (
						<GenericTable>
							<GenericTableHeader>{headers}</GenericTableHeader>
							<GenericTableBody>
								<GenericTableLoadingTable headerCells={6} />
							</GenericTableBody>
						</GenericTable>
					)}
					{isSuccess && data?.rooms.length > 0 && (
						<>
							<GenericTable>
								<GenericTableHeader>{headers}</GenericTableHeader>
								<GenericTableBody data-qa='GenericTableCurrentChatsBody'>
									{data.rooms.map((room) => renderRow({ ...room }))}
								</GenericTableBody>
							</GenericTable>
							<Pagination
								divider
								current={current}
								itemsPerPage={itemsPerPage}
								count={data.total}
								onSetItemsPerPage={setItemsPerPage}
								onSetCurrent={setCurrent}
								{...paginationProps}
							/>
						</>
					)}
				</PageContent>
			</Page>
			{id === 'custom-fields' && hasCustomFields && (
				<CustomFieldsList setCustomFields={setCustomFields} allCustomFields={allCustomFields?.customFields || []} />
			)}
		</Page>
	);
};

export default memo(CurrentChatsPage);
