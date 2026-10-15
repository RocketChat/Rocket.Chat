import { GenericTable, GenericTableBody, GenericTableCell, GenericTableHeader, GenericTableHeaderCell } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ContactsColumnsMenu from './ContactsColumnsMenu';
import type { ContactsColumnKey, ContactsColumns } from './hooks/useContactsColumns';
import { CONTACT_COLUMNS } from './hooks/useContactsColumns';

type SortProps = {
	sortBy: ContactsColumnKey;
	sortDirection: 'asc' | 'desc';
	setSort: (sortBy: ContactsColumnKey, direction?: 'asc' | 'desc') => void;
};

export type ContactsTableProps = {
	sort: SortProps;
	columns: ContactsColumns;
	children: ReactNode;
};

const ContactsTable = ({ sort, columns, children }: ContactsTableProps) => {
	const { t } = useTranslation();
	const { sortBy, sortDirection, setSort: onClickSort } = sort;

	return (
		<GenericTable>
			<GenericTableHeader>
				{CONTACT_COLUMNS.filter(({ key }) => columns.isVisible(key)).map(({ key, label }) => (
					<GenericTableHeaderCell key={key} sort={key} onClick={onClickSort} active={sortBy === key} direction={sortDirection}>
						{t(label)}
					</GenericTableHeaderCell>
				))}
				<GenericTableCell key='menu' width={44} is='td'>
					<ContactsColumnsMenu columns={columns} />
				</GenericTableCell>
			</GenericTableHeader>
			<GenericTableBody>{children}</GenericTableBody>
		</GenericTable>
	);
};

export default ContactsTable;
