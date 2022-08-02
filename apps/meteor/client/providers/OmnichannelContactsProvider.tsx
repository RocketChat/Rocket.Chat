import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, useCallback, useEffect, createContext, useMemo, useRef } from 'react';

type Contact = {
	name: string;
	phone: string;
};

type ContactsProviderProps = {
	children: ReactNode | undefined;
};

export type ContactsContextValue = {
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

export const ContactsContext = createContext<ContactsContextValue>({
	getContactByPhone: (_: string) => Promise.reject(),
});

export const OmnichannelContactsProvider = ({ children }: ContactsProviderProps): ReactElement => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const contacts = useRef<Record<string, Contact>>({});
	const pendingRequests = useRef<Map<string, Promise<Contact>>>(new Map());

	useEffect(() => {
		contacts.current = retrieveFromCache();

		const handleVisibilityChange = (): void => storeInCache(contacts.current);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const getContactByPhoneFromCache = useCallback((phone: string): Contact | null => contacts.current[phone] || null, []);

	const addContactToCache = useCallback((contact: Contact): void => {
		contacts.current[contact.phone] = contact;
	}, []);

	const fetchContactByPhone = useCallback((phone: string): ReturnType<typeof getContactBy> => getContactBy({ phone }), [getContactBy]);

	const getContactByPhone = useCallback(
		(phone: string): Promise<Contact> => {
			const cache = getContactByPhoneFromCache(phone);
			const cachedRequest = pendingRequests.current.get(phone);

			if (cache) {
				return Promise.resolve(cache);
			}

			if (cachedRequest) {
				return cachedRequest;
			}

			const request = fetchContactByPhone(phone)
				.then((data) => {
					const contact = createContact(phone, data.contact);
					addContactToCache(contact);

					return contact;
				})
				.finally(() => {
					pendingRequests.current.delete(phone);
				});

			pendingRequests.current.set(phone, request);

			return request;
		},
		[addContactToCache, fetchContactByPhone, getContactByPhoneFromCache],
	);

	const contextValue = useMemo(
		() => ({
			getContactByPhone,
		}),
		[getContactByPhone],
	);

	return <ContactsContext.Provider value={contextValue}>{children}</ContactsContext.Provider>;
};
