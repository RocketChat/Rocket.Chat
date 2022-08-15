import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

type Contact = {
	name: string;
	phone: string;
};

export type ContactsHookValue = {
	getContactByPhone(phone: string): Promise<Contact>;
};

const STORAGE_KEY = 'rcOmnichannelContacts';

const createContact = (phone: string, data: Pick<ILivechatVisitor, 'name'> | null): Contact => ({
	phone,
	name: data?.name || '',
});

const storeInCache = (contacts: Record<string, Contact>): void => {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
};

const retrieveFromCache = (): Record<string, Contact> => {
	const cache = window.localStorage.getItem(STORAGE_KEY);

	try {
		return cache ? JSON.parse(cache) : {};
	} catch (_) {
		return {};
	}
};

export const useOmnichannelContacts = (): ContactsHookValue => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const contacts = useRef<Record<string, Contact>>({});

	useEffect(() => {
		contacts.current = retrieveFromCache();
		return () => storeInCache(contacts.current);
	}, []);

	const getContactByPhoneFromCache = useCallback((phone: string): Contact | null => contacts.current[phone] || null, []);

	const addContactToCache = useCallback((contact: Contact): void => {
		contacts.current[contact.phone] = contact;
	}, []);

	const fetchContactByPhone = useCallback((phone: string): ReturnType<typeof getContactBy> => getContactBy({ phone }), [getContactBy]);

	const getContactByPhone = useCallback(
		async (phone: string): Promise<Contact> => {
			const cache = getContactByPhoneFromCache(phone);

			if (cache) {
				return Promise.resolve(cache);
			}

			const data = await fetchContactByPhone(phone);
			const contact = createContact(phone, data.contact);
			addContactToCache(contact);

			return contact;
		},
		[addContactToCache, fetchContactByPhone, getContactByPhoneFromCache],
	);

	return {
		getContactByPhone,
	};
};
