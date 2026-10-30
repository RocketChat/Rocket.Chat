import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { passkeysQueryKeys } from '../../../lib/queryKeys';

export const usePasskeys = () => {
	const listPasskeys = useEndpoint('GET', '/v1/passkeys.list');

	return useQuery({
		queryKey: passkeysQueryKeys.all,
		queryFn: async () => (await listPasskeys()).passkeys,
	});
};

export type PasskeyListItem = NonNullable<ReturnType<typeof usePasskeys>['data']>[number];
