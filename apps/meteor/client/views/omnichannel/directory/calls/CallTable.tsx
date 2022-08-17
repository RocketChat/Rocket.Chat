import { IVoipRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import React, { useState, useMemo, useCallback, FC } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import GenericTable from '../../../../components/GenericTable';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { CallDialpadButton } from '../CallDialpadButton';

export const rcxCallDialButton = css`
	&:not(:hover) {
		.rcx-call-dial-button {
			display: none !important;
		}
	}
`;

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
	open: 'false';
	roomName: string;
	agents: string[];
	count?: number;
	current?: number;
} =>
	useMemo(
		() => ({
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			open: 'false',
			roomName: text || '',
			agents: userIdLoggedIn ? [userIdLoggedIn] : [],
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage, userIdLoggedIn, text],
	);

const CallTable: FC = () => {
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
	const isCallReady = useIsCallReady();

	const resolveDirectionLabel = useCallback(
		(direction: IVoipRoom['direction']) => {
			const labels = {
				inbound: 'Incoming',
				outbound: 'Outgoing',
			} as const;
			return t(labels[direction] || 'Not_Available');
		},
		[t],
	);

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

	const { value: data } = useEndpointData('/v1/voip/rooms', query);

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
					key='direction'
					direction={sort[1]}
					active={sort[0] === 'direction'}
					onClick={onHeaderClick}
					sort='direction'
					w='x200'
				>
					{t('Direction')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='call' width={44} />,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, fname, callStarted, queue, callDuration, v, direction }) => {
			const duration = moment.duration(callDuration / 1000, 'seconds');
			const phoneNumber = Array.isArray(v?.phone) ? v?.phone[0]?.phoneNumber : v?.phone;

			return (
				<Table.Row
					key={_id}
					className={rcxCallDialButton}
					tabIndex={0}
					role='link'
					onClick={(): void => onRowClick(_id, v?.token)}
					action
					qa-user-id={_id}
					height='40px'
				>
					<Table.Cell withTruncatedText>{parseOutboundPhoneNumber(fname)}</Table.Cell>
					<Table.Cell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</Table.Cell>
					<Table.Cell withTruncatedText>{queue}</Table.Cell>
					<Table.Cell withTruncatedText>{moment(callStarted).format('L LTS')}</Table.Cell>
					<Table.Cell withTruncatedText>{duration.isValid() && duration.humanize()}</Table.Cell>
					<Table.Cell withTruncatedText>{resolveDirectionLabel(direction)}</Table.Cell>
					<Table.Cell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</Table.Cell>
				</Table.Row>
			);
		},
		[onRowClick, resolveDirectionLabel, isCallReady],
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
