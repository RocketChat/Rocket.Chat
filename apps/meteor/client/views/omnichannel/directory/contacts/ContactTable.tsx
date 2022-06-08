import { css } from '@rocket.chat/css-in-js';
import { Button, Icon, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo, useCallback, useEffect, ReactElement, MouseEvent } from 'react';

import { useHasLicense } from '../../../../../ee/client/hooks/useHasLicense';
import FilterByText from '../../../../components/FilterByText';
import GenericTable from '../../../../components/GenericTable';
import { useCallerState, useIsCallReady } from '../../../../contexts/CallContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useFormatDate } from '../../../../hooks/useFormatDate';

type Query = {
	offset?: number;
	count?: number;
	term: string;
	sort: string;
};

type TableParams = {
	text?: string;
	current?: number;
	itemsPerPage?: 25 | 50 | 100;
};

type ContactTableProps = {
	setContactReload(fn: () => void): void;
};

interface IUseQueryHook {
	(params: TableParams, columnDirection: [string, string]): Query;
}

const noop = (): void => {
	/* noop */
};

const rowClass = css`
	.contact-table__call-button {
		display: none;
	}

	&:hover .contact-table__call-button {
		display: block !important;
	}
`;

const useQuery: IUseQueryHook = ({ text, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			term: text || '',
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage, text],
	);

function ContactTable({ setContactReload }: ContactTableProps): ReactElement {
	const [params, setParams] = useState<TableParams>({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState<[string, 'asc' | 'desc']>(['username', 'asc']);
	const t = useTranslation();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500) as [any, any];
	const query = useQuery(debouncedParams, debouncedSort);
	const directoryRoute = useRoute('omnichannel-directory');
	const formatDate = useFormatDate();

	const callState = useCallerState();
	const isCallReady = useIsCallReady();
	const isInCall = callState === 'IN_CALL';
	const isEE = useHasLicense('omnichannel-voip-enterprise');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			return setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
		}
		setSort([id, 'asc']);
	});

	const onButtonNewClick = useMutableCallback(() =>
		directoryRoute.push({
			page: 'contacts',
			bar: 'new',
		}),
	);

	const onRowClick = useMutableCallback(
		(id) => (): any =>
			directoryRoute.push({
				page: 'contacts',
				id,
				bar: 'info',
			}),
	);

	const { value: data, reload } = useEndpointData('livechat/visitors.search', query);

	const handleDial =
		(phone = '') =>
		(event: MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			console.log(phone);
			// openDial(phone);
		};

	useEffect(() => {
		setContactReload(() => reload);
	}, [reload, setContactReload]);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key='username' direction={sort[1]} active={sort[0] === 'username'} onClick={onHeaderClick} sort='username'>
					{t('Username')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='name' direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='phone' direction={sort[1]} active={sort[0] === 'phone'} onClick={onHeaderClick} sort='phone'>
					{t('Phone')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key='email'
					direction={sort[1]}
					active={sort[0] === 'visitorEmails.address'}
					onClick={onHeaderClick}
					sort='visitorEmails.address'
				>
					{t('Email')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key='lastchat'
					direction={sort[1]}
					active={sort[0] === 'lastchat'}
					onClick={onHeaderClick}
					sort='visitorEmails.address'
				>
					{t('Last_Chat')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key='call' width={44} />,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, username, name, visitorEmails, phone, lastChat }) => {
			const phoneNumber = phone?.length && phone[0].phoneNumber;
			const visitorEmail = visitorEmails?.length && visitorEmails[0].address;
			const isCallDisabled = !isCallReady || isEE === 'loading' || isEE === false || isInCall || !phoneNumber;

			return (
				<Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id} className={rowClass} height='40px'>
					<Table.Cell withTruncatedText>{username}</Table.Cell>
					<Table.Cell withTruncatedText>{name}</Table.Cell>
					<Table.Cell withTruncatedText>{phoneNumber}</Table.Cell>
					<Table.Cell withTruncatedText>{visitorEmail}</Table.Cell>
					<Table.Cell withTruncatedText>{lastChat && formatDate(lastChat.ts)}</Table.Cell>
					<Table.Cell>
						<Button
							disabled={isCallDisabled}
							title={isEE ? t('Call_number') : t('Call_number_EE_only')}
							tiny
							ghost
							square
							className='contact-table__call-button'
							onClick={handleDial(phoneNumber)}
						>
							<Icon name='phone' size='x20' disabled />
						</Button>
					</Table.Cell>
				</Table.Row>
			);
		},
		[formatDate, onRowClick, isInCall, isEE, isCallReady, t],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data?.visitors}
			total={data?.total}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }): ReactElement => (
				<FilterByText displayButton textButton={t('New_Contact')} onButtonClick={onButtonNewClick} onChange={onChange || noop} {...props} />
			)}
		/>
	);
}

export default ContactTable;
