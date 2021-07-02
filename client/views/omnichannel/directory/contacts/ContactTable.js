import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useMemo, useCallback, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericTable from '../../../../components/GenericTable';
import { useRoute } from '../../../../contexts/RouterContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useFormatDate } from '../../../../hooks/useFormatDate';

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			term: text,
			sort: JSON.stringify({ [column]: direction === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[column, current, direction, itemsPerPage, text],
	);

function ContactTable({ setContactReload }) {
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['username', 'asc']);
	const t = useTranslation();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const directoryRoute = useRoute('omnichannel-directory');
	const formatDate = useFormatDate();

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
		(id) => () =>
			directoryRoute.push({
				page: 'contacts',
				id,
				bar: 'info',
			}),
	);

	const { value: data, reload } = useEndpointData('livechat/visitors.search', query);

	useEffect(() => {
		setContactReload(() => reload);
	}, [reload, setContactReload]);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell
					key={'username'}
					direction={sort[1]}
					active={sort[0] === 'username'}
					onClick={onHeaderClick}
					sort='username'
				>
					{t('Username')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'name'}
					direction={sort[1]}
					active={sort[0] === 'name'}
					onClick={onHeaderClick}
					sort='name'
				>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'phone'}
					direction={sort[1]}
					active={sort[0] === 'phone'}
					onClick={onHeaderClick}
					sort='phone'
				>
					{t('Phone')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'email'}
					direction={sort[1]}
					active={sort[0] === 'visitorEmails.address'}
					onClick={onHeaderClick}
					sort='visitorEmails.address'
				>
					{t('Email')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'lastchat'}
					direction={sort[1]}
					active={sort[0] === 'lastchat'}
					onClick={onHeaderClick}
					sort='visitorEmails.address'
				>
					{t('Last_Chat')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t],
	);

	const renderRow = useCallback(
		({ _id, username, name, visitorEmails, phone, lastChat }) => (
			<Table.Row
				key={_id}
				tabIndex={0}
				role='link'
				onClick={onRowClick(_id)}
				action
				qa-user-id={_id}
			>
				<Table.Cell withTruncatedText>{username}</Table.Cell>
				<Table.Cell withTruncatedText>{name}</Table.Cell>
				<Table.Cell withTruncatedText>{phone && phone.length && phone[0].phoneNumber}</Table.Cell>
				<Table.Cell withTruncatedText>
					{visitorEmails && visitorEmails.length && visitorEmails[0].address}
				</Table.Cell>
				<Table.Cell withTruncatedText>{lastChat && formatDate(lastChat.ts)}</Table.Cell>
			</Table.Row>
		),
		[formatDate, onRowClick],
	);

	return (
		<GenericTable
			header={header}
			renderRow={renderRow}
			results={data && data.visitors}
			total={data && data.total}
			setParams={setParams}
			params={params}
			renderFilter={({ onChange, ...props }) => (
				<FilterByText
					displayButton={true}
					textButton={t('New_Contact')}
					onButtonClick={onButtonNewClick}
					onChange={onChange}
					{...props}
				/>
			)}
		/>
	);
}

export default ContactTable;
