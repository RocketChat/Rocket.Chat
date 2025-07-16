import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Box, Button } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContactTableRow from './ContactTableRow';
import { useCurrentContacts } from './hooks/useCurrentContacts';
import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useIsCallReady } from '../../../../contexts/CallContext';

function ContactTable() {
	const { t } = useTranslation();

	const [term, setTerm] = useState('');
	const directoryRoute = useRoute('omnichannel-directory');
	const isCallReady = useIsCallReady();

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'channels.lastChat.ts' | 'contactManager.username' | 'lastChat.ts'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				searchText: term,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[itemsPerPage, current, sortBy, sortDirection, term],
		),
		500,
	);

	const onButtonNewClick = useEffectEvent(() =>
		directoryRoute.push({
			tab: 'contacts',
			context: 'new',
		}),
	);

	const { data, isLoading, isError, isSuccess, refetch } = useCurrentContacts(query);

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='lastChannel'
				direction={sortDirection}
				active={sortBy === 'channels.lastChat.ts'}
				onClick={setSort}
				sort='channels.lastChat.ts'
			>
				{t('Last_channel')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='contactManager'
				direction={sortDirection}
				active={sortBy === 'contactManager.username'}
				onClick={setSort}
				sort='contactManager.username'
			>
				{t('Contact_Manager')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='lastchat'
				direction={sortDirection}
				active={sortBy === 'lastChat.ts'}
				onClick={setSort}
				sort='lastChat.ts'
			>
				{t('Last_Chat')}
			</GenericTableHeaderCell>
			{isCallReady && <GenericTableHeaderCell key='call' width={44} />}
		</>
	);

	return (
		<>
			{((isSuccess && data?.contacts.length > 0) || queryHasChanged) && (
				<FilterByText value={term} onChange={(event) => setTerm(event.target.value)}>
					<Button onClick={onButtonNewClick} primary>
						{t('New_contact')}
					</Button>
				</FilterByText>
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={headers.props.children.filter(Boolean).length} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.contacts.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.contacts.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='user-plus'
					title={t('No_contacts_yet')}
					description={t('No_contacts_yet_description')}
					buttonTitle={t('New_contact')}
					buttonAction={onButtonNewClick}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_contacts')}
				/>
			)}
			{isSuccess && data?.contacts.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>{data?.contacts.map((contact) => <ContactTableRow key={contact._id} {...contact} />)}</GenericTableBody>
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
				<Box mbs={20}>
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
