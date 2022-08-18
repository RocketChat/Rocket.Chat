import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { parseOutboundPhoneNumber } from '../../../ee/client/lib/voip/parseOutboundPhoneNumber';

type Contact = {
	name: string;
	phone: string;
};

const createContact = (phone: string, data: Pick<ILivechatVisitor, 'name'> | null): Contact => ({
	phone,
	name: data?.name || '',
});

export const useOmnichannelContact = (phone: string): Contact => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const safePhone = parseOutboundPhoneNumber(phone);
	const [contact, setContact] = useState<Contact>({ phone: safePhone, name: safePhone });

	const getContactByPhone = useCallback(
		async (phone: string): Promise<Contact> => {
			const data = await getContactBy({ phone });
			return createContact(phone, data.contact);
		},
		[getContactBy],
	);

	useEffect(() => {
		getContactByPhone(safePhone).then(setContact);
	}, [safePhone, getContactByPhone]);

	return contact;
};
