import type { TableColumns } from '../../../hooks/useTableColumns';
import { useTableColumns } from '../../../hooks/useTableColumns';

export const CONTACT_COLUMNS = [
	{ key: 'displayName', label: 'Name', disabled: true },
	{ key: 'emails.address', label: 'Email', disabled: true },
	{ key: 'phones.raw', label: 'Phone', disabled: true },
	{ key: 'categories', label: 'Categories', disabled: false },
	{ key: 'companyName', label: 'Company', disabled: false },
	{ key: 'officeLocation', label: 'Office_location', disabled: false },
] as const;

export type ContactsColumnKey = (typeof CONTACT_COLUMNS)[number]['key'];

export type ContactsColumns = TableColumns<ContactsColumnKey>;

const STORAGE_KEY = 'contacts-hidden-columns';

export const useContactsColumns = (): ContactsColumns => useTableColumns(STORAGE_KEY, CONTACT_COLUMNS);
