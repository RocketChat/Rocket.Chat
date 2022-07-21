import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

type ContactsHookAPI = {
	getContactByPhone(phone: string): Promise<Contact>;
};

type Contact = {
	name: string;
	phone: string;
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

export const useOmnichannelContacts = (): ContactsHookAPI => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const [contacts, setContacts] = useState<Record<string, Contact>>(retrieveFromCache);

	useEffect(() => {
		storeInCache(contacts);
	}, [contacts]);

	const getContactByPhoneFromCache = useCallback((phone: string): Contact | null => contacts[phone] || null, [contacts]);

	const addContactToCache = useCallback(
		(contact: Contact): void => {
			setContacts({ ...contacts, [contact.phone]: contact });
		},
		[contacts],
	);

	const fetchContactByPhone = useCallback((phone: string): ReturnType<typeof getContactBy> => getContactBy({ phone }), [getContactBy]);

	const getContactByPhone = useCallback(
		async (phone: string): Promise<Contact> => {
			const cache = getContactByPhoneFromCache(phone);
			if (cache) {
				return cache;
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
