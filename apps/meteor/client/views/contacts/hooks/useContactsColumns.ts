import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

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

const STORAGE_KEY = 'contacts-hidden-columns';

const isColumnDisabled = (key: ContactsColumnKey) => CONTACT_COLUMNS.some((column) => column.key === key && column.disabled);

export const useContactsColumns = (): ContactsColumns => {
	const [hidden, setHidden] = useLocalStorage<ContactsColumnKey[]>(STORAGE_KEY, []);

	// A key stored before a column was renamed or locked would hide something the menu cannot bring back
	const isVisible = useCallback((key: ContactsColumnKey) => isColumnDisabled(key) || !hidden.includes(key), [hidden]);

	const toggle = useCallback(
		(key: ContactsColumnKey) => {
			if (isColumnDisabled(key)) {
				return;
			}

			setHidden((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
		},
		[setHidden],
	);

	return { isVisible, isDisabled: isColumnDisabled, toggle };
};
