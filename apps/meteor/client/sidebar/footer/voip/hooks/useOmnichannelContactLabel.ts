import { ICallerInfo } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { parseOutboundPhoneNumber } from '../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';

export const useOmnichannelContactLabel = (caller: ICallerInfo): string => {
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const phone = parseOutboundPhoneNumber(caller.callerId);

	const { data } = useQuery(['getContactsByPhone', phone], async () => getContactBy({ phone }).then(({ contact }) => contact));

	// TODO: callerName is typed as required so maybe we should not use phone as fallback
	return data?.name || caller.callerName || phone;
};
