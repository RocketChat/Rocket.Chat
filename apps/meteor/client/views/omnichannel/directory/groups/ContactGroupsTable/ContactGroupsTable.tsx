import { Pagination, States, StatesAction, StatesActions, StatesIcon, StatesTitle, Box } from '@rocket.chat/fuselage';
import { useDebouncedState, useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../../../components/FilterByText';
// import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../components/GenericTable/hooks/useSort';
import ContactGroupsTableRow from './ContactGroupsTableRow';

const fakeGroups = [
	{
		_id: '1',
		name: 'Group 1',
		archived: false,
		contacts: 10,
	},
	{
		_id: '2',
		name: 'Group 2',
		archived: false,
		contacts: 10,
	},
	{
		_id: '3',
		name: 'Group 3',
		archived: true,
		contacts: 10,
	},
];

const ContactGroupsTable = () => {
	const t = useTranslation();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'contacts' | 'status'>('name');

	const [term, setTerm] = useDebouncedState('', 500);

	// const query = useDebouncedValue(
	// 	useMemo(
	// 		() => ({
	// 			term,
	// 			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
	// 			...(itemsPerPage && { count: itemsPerPage }),
	// 			...(current && { offset: current }),
	// 		}),
	// 		[itemsPerPage, current, sortBy, sortDirection, term],
	// 	),
	// 	500,
	// );

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='contacts' direction={sortDirection} active={sortBy === 'contacts'} onClick={setSort} sort='contacts'>
				{t('Contacts')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='status' direction={sortDirection} active={sortBy === 'status'} onClick={setSort} sort='status'>
				{t('Status')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x48' />
		</>
	);

	const isLoading = false;

	return (
		<>
			<FilterByText onChange={({ text }) => setTerm(text)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={6} />
					</GenericTableBody>
				</GenericTable>
			)}
			{/* {isSuccess && data?.visitors.length === 0 && queryHasChanged && <GenericNoResults />}
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
			)} */}
			{!isLoading && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{fakeGroups.map((group) => (
								<ContactGroupsTableRow key={group._id} {...group} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={fakeGroups?.length}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{/* {isError && (
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
			)} */}
		</>
	);
};

export default ContactGroupsTable;
