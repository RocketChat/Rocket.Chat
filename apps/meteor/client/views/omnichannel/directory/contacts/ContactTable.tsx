import {
	Pagination,
	States,
	StatesAction,
	StatesActions,
	StatesIcon,
	StatesTitle,
	Box,
	CheckBox,
	TableSelection,
	TableSelectionButton,
	Divider,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import { useDebouncedState, useDebouncedValue, useEffectEvent, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import { hashQueryKey } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

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
import { usePreventPropagation } from '../../../../hooks/usePreventPropagation';
import { parseOutboundPhoneNumber } from '../../../../lib/voip/parseOutboundPhoneNumber';
import { CallDialpadButton } from '../components/CallDialpadButton';
import ContactGroupModal from './ContactGroupModal';
import { useContactsTableSelection } from './hooks/useContactsTableSelection';
import { useCurrentContacts } from './hooks/useCurrentContacts';

const ContactTable = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const formatDate = useFormatDate();
	const preventPropagation = usePreventPropagation();

	const isCallReady = useIsCallReady();
	const [term, setTerm] = useDebouncedState('', 500);
	const directoryRoute = useRoute('omnichannel-directory');

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'username' | 'phone' | 'name' | 'visitorEmails.address' | 'lastChat.ts'>('username');

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

	const onButtonNewClick = useMutableCallback(() =>
		directoryRoute.push({
			tab: 'contacts',
			context: 'new',
		}),
	);

	const onRowClick = useEffectEvent((id) => {
		directoryRoute.push({
			id,
			tab: 'contacts',
			context: 'details',
		});
	});

	const { data, isLoading, isError, isSuccess, refetch } = useCurrentContacts(query);

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const {
		indeterminate,
		checked,
		selectedContacts,
		selectedContactsLength,
		handleToggleAllContacts,
		handleChangeContactSelection,
		setSelectedContacts,
	} = useContactsTableSelection(data?.visitors || []);

	// TODO: To be implemented
	const handleConfirmGroupCreation = () => console.log('created');

	const handleCreateGroup = () => {
		setModal(<ContactGroupModal onCancel={() => setModal(null)} onConfirm={handleConfirmGroupCreation} />);
	};

	const headers = (
		<>
			{/* <GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('Username')}
			</GenericTableHeaderCell> */}
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				<CheckBox indeterminate={indeterminate} checked={checked} onChange={handleToggleAllContacts} />
				<Box is='span' mis={8}>
					{t('Name')}
				</Box>
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
			<GenericTableHeaderCell
				key='lastchat'
				direction={sortDirection}
				active={sortBy === 'lastChat.ts'}
				onClick={setSort}
				sort='lastChat.ts'
			>
				{t('Last_Chat')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='call' width={44} />
		</>
	);

	return (
		<>
			{((isSuccess && data?.visitors.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setTerm(text)} />}
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
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_contacts')}
				/>
			)}
			{isSuccess && data?.visitors.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.visitors.map((visitor) => {
								const { _id, fname, name, visitorEmails, phone, lastChat } = visitor;
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
										onClick={() => onRowClick(_id)}
									>
										{/* <GenericTableCell withTruncatedText>{username}</GenericTableCell> */}
										<GenericTableCell onClick={preventPropagation} withTruncatedText>
											<CheckBox checked={!!selectedContacts[_id]} onChange={() => handleChangeContactSelection(visitor)} />
											<Box is='span' mis={8}>
												{parseOutboundPhoneNumber(fname || name)}
											</Box>
										</GenericTableCell>
										<GenericTableCell withTruncatedText>{parseOutboundPhoneNumber(phoneNumber)}</GenericTableCell>
										<GenericTableCell withTruncatedText>{visitorEmail}</GenericTableCell>
										<GenericTableCell withTruncatedText>{lastChat && formatDate(lastChat.ts)}</GenericTableCell>
										<GenericTableCell>{isCallReady && <CallDialpadButton phoneNumber={phoneNumber} />}</GenericTableCell>
									</GenericTableRow>
								);
							})}
						</GenericTableBody>
					</GenericTable>
					{selectedContactsLength > 0 && (
						<TableSelection text={`${selectedContactsLength} Items selected`}>
							<ButtonGroup>
								<TableSelectionButton onClick={handleCreateGroup}>Create group</TableSelectionButton>
								<TableSelectionButton>Delete</TableSelectionButton>
								<Divider vertical />
								<TableSelectionButton onClick={() => setSelectedContacts({})}>Cancel</TableSelectionButton>
							</ButtonGroup>
						</TableSelection>
					)}
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
};

export default ContactTable;
