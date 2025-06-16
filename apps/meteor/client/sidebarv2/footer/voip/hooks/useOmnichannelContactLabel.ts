import type { ICallerInfo } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { parseOutboundPhoneNumber } from '../../../../lib/voip/parseOutboundPhoneNumber';

export const useOmnichannelContactLabel = (caller: ICallerInfo): string => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const phone = parseOutboundPhoneNumber(caller.callerId);

	const { data } = useQuery({
		queryKey: ['getContactsByPhone', phone],
		queryFn: async () => getContactBy({ phone }).then(({ contact }) => contact),
		enabled: !!phone,
	});

	return data?.name || caller.callerName || phone;
};
