import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { useMemo, useCallback, useState, FC } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useEndpointData } from '../../../hooks/useEndpointData';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import Chat from '../directory/chats/Chat';
import CurrentChatsPage from './CurrentChatsPage';
import RemoveChatButton from './RemoveChatButton';

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
		customFields: any;
		itemsPerPage: number;
		current: number;
	},
	debouncedSort: any[],
) => any;

const sortDir = (sortDir: string): number => (sortDir === 'asc' ? 1 : -1);

const useQuery: useQueryType = (
	{ guest, servedBy, department, status, from, to, tags, customFields, itemsPerPage, current },
	[column, direction],
) =>
	useMemo(() => {
		const query: {
			roomName?: string;
			sort: string;
			count?: number;
			offset?: number;
			createdAt?: string;
			open?: boolean;
			agents?: string[];
			departmentId?: string;
			tags?: string[];
			customFields?: string;
			onhold?: boolean;
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
			query.customFields = JSON.stringify(customFields);
		}

		return query;
	}, [guest, column, direction, itemsPerPage, current, from, to, status, servedBy, department, tags, customFields]);

const CurrentChatsRoute: FC = () => {
	const t = useTranslation();
	const canViewCurrentChats = usePermission('view-livechat-current-chats');
	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const directoryRoute = useRoute('omnichannel-current-chats');
	const id = useRouteParameter('id');

	const [params, setParams] = useState({
		guest: '',
		fname: '',
		servedBy: '',
		status: '',
		department: '',
		from: '',
		to: '',
		customFields: {},
		current: 0,
		itemsPerPage: 25,
		tags: [] as string[],
	});
	const [sort, setSort] = useState<[string, 'asc' | 'desc' | undefined]>(['ts', 'desc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((_id) => {
		directoryRoute.push({ id: _id });
	});

	const { value: data, reload } = useEndpointData('livechat/rooms', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'fname'} direction={sort[1]} active={sort[0] === 'fname'} onClick={onHeaderClick} sort='fname'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'departmentId'}
					direction={sort[1]}
					active={sort[0] === 'departmentId'}
					onClick={onHeaderClick}
					sort='departmentId'
				>
					{t('Department')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'servedBy'}
					direction={sort[1]}
					active={sort[0] === 'servedBy'}
					onClick={onHeaderClick}
					sort='servedBy'
				>
					{t('Served_By')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts'>
					{t('Started_At')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'lm'} direction={sort[1]} active={sort[0] === 'lm'} onClick={onHeaderClick} sort='lm'>
					{t('Last_Message')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'open'} direction={sort[1]} active={sort[0] === 'open'} onClick={onHeaderClick} sort='open' w='x100'>
					{t('Status')}
				</GenericTable.HeaderCell>,
				canRemoveClosedChats && (
					<GenericTable.HeaderCell key={'remove'} w='x60'>
						{t('Remove')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, canRemoveClosedChats],
	);

	const renderRow = useCallback(
		({ _id, fname, servedBy, ts, lm, department, open, onHold }) => {
			const getStatusText = (open: boolean, onHold: boolean): string => {
				if (!open) return t('Closed');
				return onHold ? t('On_Hold_Chats') : t('Open');
			};

			return (
				<Table.Row key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id)} action qa-user-id={_id}>
					<Table.Cell withTruncatedText>{fname}</Table.Cell>
					<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
					<Table.Cell withTruncatedText>{servedBy?.username}</Table.Cell>
					<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
					<Table.Cell withTruncatedText>{moment(lm).format('L LTS')}</Table.Cell>
					<Table.Cell withTruncatedText>{getStatusText(open, onHold)}</Table.Cell>
					{canRemoveClosedChats && !open && <RemoveChatButton _id={_id} reload={reload} />}
				</Table.Row>
			);
		},
		[onRowClick, reload, canRemoveClosedChats, t],
	);

	if (!canViewCurrentChats) {
		return <NotAuthorizedPage />;
	}

	return id ? (
		<Chat rid={id} />
	) : (
		<CurrentChatsPage
			setParams={setParams}
			params={params}
			data={data}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Current_Chats')}
		></CurrentChatsPage>
	);
};

export default CurrentChatsRoute;
