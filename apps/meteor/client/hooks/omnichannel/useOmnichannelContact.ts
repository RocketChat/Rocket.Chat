import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { parseOutboundPhoneNumber } from '../../../ee/client/lib/voip/parseOutboundPhoneNumber';

type Contact = {
	name: string;
	phone: string;
};

const createContact = (phone: string, data: Pick<ILivechatVisitor, 'name'> | null): Contact => ({
	phone,
	name: data?.name || '',
});

export const useOmnichannelContact = (ogPhone: string, name = ''): Contact => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const phone = parseOutboundPhoneNumber(ogPhone);
	const [defaultContact] = useState<Contact>({ phone, name });

	const {
		data: contact,
		isLoading,
		isError,
	} = useQuery(['getContactsByPhone', phone], async (): Promise<Contact> => {
		const { contact } = await getContactBy({ phone });
		return createContact(phone, contact);
	});

	return isLoading || isError || !contact ? defaultContact : contact;
};
