import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useState, useMemo, useCallback, FC } from 'react';

import GenericTable from '../../../../components/GenericTable';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const useQuery = (
	{
		text,
		itemsPerPage,
		current,
	}: {
		text?: string;
		itemsPerPage?: 25 | 50 | 100;
		current?: number;
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

const CallTable: FC = () => {
	const [params, setParams] = useState<{ text?: string; current?: number; itemsPerPage?: 25 | 50 | 100 }>({
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

	const onRowClick = useMutableCallback((id, token) => {
		directoryRoute.push(
			{
				page: 'calls',
				bar: 'info',
				id,
			},
			{ token },
		);
	});

	const { value: data } = useEndpointData('voip/rooms', query);

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
					key={'phone'}
					direction={sort[1]}
					active={sort[0] === 'phone'}
					onClick={onHeaderClick}
					sort='phone'
					w='x200'
				>
					{t('Phone')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'queue'} direction={sort[1]} active={sort[0] === 'queue'} onClick={onHeaderClick} sort='ts' w='x100'>
					{t('Queue')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' w='x200'>
					{t('Started_At')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'callDuration'}
					direction={sort[1]}
					active={sort[0] === 'callDuration'}
					onClick={onHeaderClick}
					sort='callDuration'
					w='x120'
				>
					{t('Talk_Time')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'source'}
					direction={sort[1]}
					active={sort[0] === 'source'}
					onClick={onHeaderClick}
					sort='source'
					w='x200'
				>
					{t('Source')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, fname, callStarted, queue, callDuration, v }) => {
			const duration = moment.duration(callDuration / 1000, 'seconds');
			return (
				<Table.Row key={_id} tabIndex={0} role='link' onClick={(): void => onRowClick(_id, v?.token)} action qa-user-id={_id}>
					<Table.Cell withTruncatedText>{fname}</Table.Cell>
					<Table.Cell withTruncatedText>{Array.isArray(v?.phone) ? v?.phone[0]?.phoneNumber : v?.phone}</Table.Cell>
					<Table.Cell withTruncatedText>{queue}</Table.Cell>
					<Table.Cell withTruncatedText>{moment(callStarted).format('L LTS')}</Table.Cell>
					<Table.Cell withTruncatedText>{duration.isValid() && duration.humanize()}</Table.Cell>
					<Table.Cell withTruncatedText>{t('Incoming')}</Table.Cell>
				</Table.Row>
			);
		},
		[onRowClick, t],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.rooms}
			total={data?.total}
			setParams={setParams}
			params={params}
			// renderFilter={({ onChange, ...props }: any): ReactElement => <FilterByText onChange={onChange} {...props} />}
		/>
	);
};

export default CallTable;
