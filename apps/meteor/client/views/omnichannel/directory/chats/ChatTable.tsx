import { Table, Tag, Box } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import type { FC, ReactElement, Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericTable from '../../../../components/GenericTable';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const useQuery = (
	{
		text,
		itemsPerPage,
		current,
	}: {
		text?: string;
		itemsPerPage: 25 | 50 | 100;
		current: number;
	},
	[column, direction]: string[],
	userIdLoggedIn: string | null,
): {
	sort: string;
	open: boolean;
	roomName: string;
	agents: string[];
	count?: number;
	current?: number;
} =>
	useMemo(
		() => ({
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			open: false,
			roomName: text || '',
			agents: userIdLoggedIn ? [userIdLoggedIn] : [],
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage, userIdLoggedIn, text],
	);

const ChatTable: FC<{ setChatReload: Dispatch<SetStateAction<any>> }> = ({ setChatReload }) => {
	const [params, setParams] = useState<{ text?: string; current: number; itemsPerPage: 25 | 50 | 100 }>({
		text: '',
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['closedAt', 'desc']);
	const t = useTranslation();
	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const userIdLoggedIn = Meteor.userId();
	const query = useQuery(debouncedParams, debouncedSort, userIdLoggedIn);
	const directoryRoute = useRoute('omnichannel-directory');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback((id) =>
		directoryRoute.push({
			page: 'chats',
			bar: 'info',
			id,
		}),
	);

	const { value: data, reload } = useEndpointData('/v1/livechat/rooms', query as any); // TODO: Check the typing for the livechat/rooms endpoint as it seems wrong

	useEffect(() => {
		setChatReload?.(() => reload);
	}, [reload, setChatReload]);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'fname'}
					direction={sort[1]}
					active={sort[0] === 'fname'}
					onClick={onHeaderClick}
					sort='fname'
					w='x400'
				>
					{t('Contact_Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'department'}
					direction={sort[1]}
					active={sort[0] === 'department'}
					onClick={onHeaderClick}
					sort='department'
					w='x200'
				>
					{t('Department')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' w='x200'>
					{t('Started_At')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'chatDuration'}
					direction={sort[1]}
					active={sort[0] === 'chatDuration'}
					onClick={onHeaderClick}
					sort='chatDuration'
					w='x120'
				>
					{t('Chat_Duration')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'closedAt'}
					direction={sort[1]}
					active={sort[0] === 'closedAt'}
					onClick={onHeaderClick}
					sort='closedAt'
					w='x200'
				>
					{t('Closed_At')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, fname, ts, closedAt, department, tags }) => (
			<Table.Row key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id)} action qa-user-id={_id}>
				<Table.Cell withTruncatedText>
					<Box display='flex' flexDirection='column'>
						<Box withTruncatedText>{fname}</Box>
						{tags && (
							<Box color='hint' display='flex' flex-direction='row'>
								{tags.map((tag: string) => (
									<Box
										style={{
											marginTop: 4,
											whiteSpace: 'nowrap',
											overflow: tag.length > 10 ? 'hidden' : 'visible',
											textOverflow: 'ellipsis',
										}}
										key={tag}
										mie='x4'
									>
										<Tag style={{ display: 'inline' }} disabled>
											{tag}
										</Tag>
									</Box>
								))}
							</Box>
						)}
					</Box>
				</Table.Cell>
				<Table.Cell withTruncatedText>{department ? department.name : ''}</Table.Cell>
				<Table.Cell withTruncatedText>{moment(ts).format('L LTS')}</Table.Cell>
				<Table.Cell withTruncatedText>{moment(closedAt).from(moment(ts), true)}</Table.Cell>
				<Table.Cell withTruncatedText>{moment(closedAt).format('L LTS')}</Table.Cell>
			</Table.Row>
		),
		[onRowClick],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.rooms}
			total={data?.total}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }: any): ReactElement => <FilterByText onChange={onChange} {...props} />}
		/>
	);
};

export default ChatTable;
