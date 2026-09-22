import { useCallback, useState } from 'react';

export const CONTACT_COLUMNS = [
	{ key: 'displayName', label: 'Name', disabled: true },
	{ key: 'emails.address', label: 'Email', disabled: true },
	{ key: 'phones.raw', label: 'Phone', disabled: true },
	{ key: 'categories', label: 'Categories', disabled: false },
	{ key: 'companyName', label: 'Company', disabled: false },
	{ key: 'officeLocation', label: 'Office_location', disabled: false },
] as const;

export type ContactsColumnKey = (typeof CONTACT_COLUMNS)[number]['key'];

export type ContactsColumns = {
	isVisible: (key: ContactsColumnKey) => boolean;
	isDisabled: (key: ContactsColumnKey) => boolean;
	toggle: (key: ContactsColumnKey) => void;
};

const isColumnDisabled = (key: ContactsColumnKey) => CONTACT_COLUMNS.some((column) => column.key === key && column.disabled);

export const useContactsColumns = (): ContactsColumns => {
	const [hidden, setHidden] = useState<ContactsColumnKey[]>([]);

	const isVisible = useCallback((key: ContactsColumnKey) => !hidden.includes(key), [hidden]);

	const toggle = useCallback((key: ContactsColumnKey) => {
		if (isColumnDisabled(key)) {
			return;
		}

		setHidden((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
	}, []);

	return { isVisible, isDisabled: isColumnDisabled, toggle };
};
