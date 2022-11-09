import { Box, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { QueueListPage } from './QueueListPage';
import { useQuery } from './hooks/useQuery';

const QueueList = (): ReactElement => {
	const t = useTranslation();
	const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['servedBy', 'desc']);

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const header = useMemo(
		() =>
			[
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'servedBy'}
						direction={sort[1]}
						active={sort[0] === 'servedBy'}
						onClick={onHeaderClick}
						sort='servedBy'
					>
						{t('Served_By')}
					</GenericTable.HeaderCell>
				),
				<GenericTable.HeaderCell
					key={'department'}
					direction={sort[1]}
					active={sort[0] === 'departmend'}
					onClick={onHeaderClick}
					sort='department'
				>
					{t('Department')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'total'} direction={sort[1]} active={sort[0] === 'total'} onClick={onHeaderClick} sort='total'>
					{t('Total')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'status'} direction={sort[1]} active={sort[0] === 'status'} onClick={onHeaderClick} sort='status'>
					{t('Status')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[mediaQuery, sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ user, department, chats }) => {
			const getStatusText = (): string => {
				if (user.status === 'online') {
					return t('Online');
				}

				return t('Offline');
			};

			return (
				<Table.Row key={user._id} tabIndex={0}>
					<Table.Cell withTruncatedText>
						<Box display='flex' alignItems='center' mb='5px'>
							<UserAvatar size={mediaQuery ? 'x28' : 'x40'} username={user.username} />
							<Box display='flex' mi='x8'>
								{user.username}
							</Box>
						</Box>
					</Table.Cell>
					<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
					<Table.Cell withTruncatedText>{chats}</Table.Cell>
					<Table.Cell withTruncatedText>{getStatusText()}</Table.Cell>
				</Table.Row>
			);
		},
		[mediaQuery, t],
	);

	const [params, setParams] = useState<{
		servedBy: string;
		status: string;
		departmentId: string;
		itemsPerPage: 25 | 50 | 100;
		current: number;
	}>({
		servedBy: '',
		status: '',
		departmentId: '',
		itemsPerPage: 25,
		current: 0,
	});
	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const { value: data } = useEndpointData('/v1/livechat/queue', query);

	return (
		<QueueListPage title={t('Livechat_Queue')} header={header} data={data} renderRow={renderRow} params={params} setParams={setParams} />
	);
};

export default QueueList;
