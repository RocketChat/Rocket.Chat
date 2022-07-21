import { useEffect, useState } from 'react';

import { parseOutboundPhoneNumber } from '../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import { useOmnichannelContacts } from './useOmnichannelContacts';

export const useContactName = (phone: string): string => {
	const safePhone = parseOutboundPhoneNumber(phone);
	const { getContactByPhone } = useOmnichannelContacts();
	const [name, setName] = useState(safePhone);

	useEffect(() => {
		getContactByPhone(safePhone).then((contact) => {
			setName(contact.name || contact.phone);
		});
	}, [safePhone, getContactByPhone]);

	return name;
};
