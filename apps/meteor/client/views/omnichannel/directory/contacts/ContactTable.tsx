import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Box } from '@rocket.chat/fuselage';
import { useDebouncedState, useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { hashQueryKey } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableCell,
	GenericTableBody,
	GenericTableRow,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useIsCallReady } from '../../../../contexts/CallContext';
import { useFormatDate } from '../../../../hooks/useFormatDate';
import { CallDialpadButton } from '../components/CallDialpadButton';
import { useCurrentContacts } from './hooks/useCurrentContacts';

function ContactTable(): ReactElement {
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'username' | 'phone' | 'name' | 'visitorEmails.address' | 'lastchat'>('username');
	const isCallReady = useIsCallReady();

	const [term, setTerm] = useDebouncedState('', 500);

	const t = useTranslation();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				term,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[itemsPerPage, current, sortBy, sortDirection, term],
		),
		500,
	);

	const directoryRoute = useRoute('omnichannel-directory');
	const formatDate = useFormatDate();

	const onButtonNewClick = useMutableCallback(() =>
		directoryRoute.push({
			page: 'contacts',
			bar: 'new',
		}),
	);

	const onRowClick = useMutableCallback(
		(id) => (): void =>
			directoryRoute.push({
				page: 'contacts',
				id,
				bar: 'info',
			}),
	);

	const { data, isLoading, isError, isSuccess, refetch } = useCurrentContacts(query);

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('Username')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='phone' direction={sortDirection} active={sortBy === 'phone'} onClick={setSort} sort='phone'>
				{t('Phone')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='email'
				direction={sortDirection}
				active={sortBy === 'visitorEmails.address'}
				onClick={setSort}
				sort='visitorEmails.address'
			>
				{t('Email')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='lastchat' direction={sortDirection} active={sortBy === 'lastchat'} onClick={setSort} sort='lastchat'>
				{t('Last_Chat')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='call' width={44} />
		</>
	);

	return (
		<>
			{((isSuccess && data?.visitors.length > 0) || queryHasChanged) && (
				<FilterByText
					displayButton
					textButton={t('New_contact')}
					onButtonClick={onButtonNewClick}
					onChange={({ text }): void => setTerm(text)}
				/>
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={6} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.visitors.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.visitors.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='user-plus'
					title={t('No_contacts_yet')}
					description={t('No_contacts_yet_description')}
					buttonTitle={t('New_contact')}
					buttonAction={onButtonNewClick}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_contacts')}
				/>
			)}
			{isSuccess && data?.visitors.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.visitors.map(({ _id, username, fname, name, visitorEmails, phone, lastChat }) => {
								const phoneNumber = (phone?.length && phone[0].phoneNumber) || '';
								const visitorEmail = visitorEmails?.length && visitorEmails[0].address;

								return (
									<GenericTableRow
										action
										key={_id}
										tabIndex={0}
										role='link'
										height='40px'
										qa-user-id={_id}
										rcx-show-call-button-on-hover
										onClick={onRowClick(_id)}
									>
										<GenericTableCell withTruncatedText>{username}</GenericTableCell>
										<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(fname || name)}</GenericTableCell>
										<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</GenericTableCell>
										<GenericTableCell withTruncatedText>{visitorEmail}</GenericTableCell>
										<GenericTableCell withTruncatedText>{lastChat && formatDate(lastChat.ts)}</GenericTableCell>
										<GenericTableCell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</GenericTableCell>
									</GenericTableRow>
								);
							})}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isError && (
				<Box mbs='x20'>
					<States>
						<StatesIcon variation='danger' name='circle-exclamation' />
						<StatesTitle>{t('Connection_error')}</StatesTitle>
						<StatesActions>
							<StatesAction icon='reload' onClick={() => refetch()}>
								{t('Reload_page')}
							</StatesAction>
						</StatesActions>
					</States>
				</Box>
			)}
		</>
	);
}

export default ContactTable;
