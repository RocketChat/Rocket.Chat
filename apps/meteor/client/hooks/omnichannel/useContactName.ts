import { useEffect, useState } from 'react';

import { useOmnichannelContacts } from './useOmnichannelContacts';

export const useContactName = (phone: string): string => {
	const safePhone = `+${phone.replace(/\D/g, '')}`;
	const { getContactByPhone } = useOmnichannelContacts();
	const [name, setName] = useState(safePhone);

	useEffect(() => {
		getContactByPhone(safePhone).then((contact) => {
			setName(contact.name || contact.phone);
		});
	}, [safePhone, getContactByPhone]);

	return name;
};
