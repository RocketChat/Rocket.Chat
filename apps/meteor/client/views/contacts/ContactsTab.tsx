import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { GenericTableLoadingRow, usePagination, useSort } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContactEdit from './ContactEdit';
import ContactInfo from './ContactInfo';
import ContactsPageFilters, { useContactsPageFilters } from './ContactsPageFilters';
import ContactsTable from './ContactsTable';
import ContactsTableRow from './ContactsTableRow';
import type { ContactsColumnKey } from './hooks/useContactsColumns';
import { useContactsColumns } from './hooks/useContactsColumns';
import GenericNoResults from '../../components/GenericNoResults';
import type { CallHistoryTab } from '../mediaCallHistory/CallHistoryPageLayout';
import CallHistoryPageLayout from '../mediaCallHistory/CallHistoryPageLayout';

type ContactsTabProps = {
	tab: CallHistoryTab;
	onChangeTab: (tab: CallHistoryTab) => void;
};

type Panel = { kind: 'info'; contact: Serialized<IContact> } | { kind: 'form'; contact?: Serialized<IContact> };

const ContactsTab = ({ tab, onChangeTab }: ContactsTabProps) => {
	const { t } = useTranslation();
	const sortProps = useSort<ContactsColumnKey>('displayName', 'asc');
	const { setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const columns = useContactsColumns();
	const [panel, setPanel] = useState<Panel>();

	const listContacts = useEndpoint('GET', '/v1/contacts.list');

	const filterProps = useContactsPageFilters();
	const { searchText } = filterProps;
	const debouncedSearchText = useDebouncedValue(searchText, 400);

	const { data, isPending, error, refetch } = useQuery({
		queryKey: [
			'contacts',
			'list',
			sortProps.sortBy,
			sortProps.sortDirection,
			paginationProps.current,
			paginationProps.itemsPerPage,
			debouncedSearchText,
		],
		queryFn: () =>
			listContacts({
				count: paginationProps.itemsPerPage,
				offset: paginationProps.current,
				sort: JSON.stringify({ [sortProps.sortBy]: sortProps.sortDirection === 'asc' ? 1 : -1 }),
				...(debouncedSearchText && { text: debouncedSearchText }),
			}),
	});

	const contactFilters = (
		<ContactsPageFilters {...filterProps} onCreate={() => setPanel({ kind: 'form' })} total={data?.syncedTotal ?? 0} />
	);

	const closePanel = () => setPanel(undefined);

	const contextualBar =
		panel?.kind === 'info' ? (
			<ContactInfo contact={panel.contact} onEdit={() => setPanel({ kind: 'form', contact: panel.contact })} onClose={closePanel} />
		) : (
			panel?.kind === 'form' && (
				<ContactEdit contact={panel.contact} onSaved={(contact) => setPanel({ kind: 'info', contact })} onClose={closePanel} />
			)
		);

	const pagination = (
		<Pagination divider count={data?.total || 0} onSetItemsPerPage={setItemsPerPage} onSetCurrent={setCurrent} {...paginationProps} />
	);

	if (isPending) {
		return (
			<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
				<ContactsTable sort={sortProps} columns={columns}>
					<GenericTableLoadingRow cols={7} />
					<GenericTableLoadingRow cols={7} />
					<GenericTableLoadingRow cols={7} />
					<GenericTableLoadingRow cols={7} />
				</ContactsTable>
				{pagination}
			</CallHistoryPageLayout>
		);
	}

	if (error) {
		return (
			<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
				<GenericNoResults
					icon='warning'
					title={t('Something_went_wrong')}
					description={t('Please_try_again')}
					buttonTitle={t('Reload_page')}
					buttonAction={() => refetch()}
				/>
			</CallHistoryPageLayout>
		);
	}

	return (
		<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
			{data.items.length === 0 && (
				<GenericNoResults icon='address-book' title={t('No_contacts')} description={t('No_contacts_description')} />
			)}
			{data.items.length > 0 && (
				<ContactsTable sort={sortProps} columns={columns}>
					{data.items.map((contact) => (
						<ContactsTableRow
							key={contact._id}
							contact={contact}
							columns={columns}
							onClick={() => setPanel({ kind: 'info', contact })}
							onEdit={() => setPanel({ kind: 'form', contact })}
						/>
					))}
				</ContactsTable>
			)}
			{pagination}
		</CallHistoryPageLayout>
	);
};

export default ContactsTab;
