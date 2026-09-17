import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { managedPresenceQueryKeys } from '../../../lib/queryKeys';

export type ManagedPresenceUser = OperationResult<'GET', '/v1/users.listStatusVisibility'>['users'][number];

export const useManagedPresenceUsers = ({ searchTerm, count, offset }: { searchTerm: string; count: number; offset: number }) => {
	const listStatusVisibility = useEndpoint('GET', '/v1/users.listStatusVisibility');

	return useQuery({
		queryKey: managedPresenceQueryKeys.list({ searchTerm, count, offset }),
		queryFn: () => listStatusVisibility({ searchTerm, count, offset }),
		meta: {
			apiErrorToastMessage: true,
		},
	});
};

export const useFindManagedUser = () => {
	const listStatusVisibility = useEndpoint('GET', '/v1/users.listStatusVisibility');

	return useStableCallback(async (username: string) => {
		const count = 50;

		for (let offset = 0; ; offset += count) {
			const { users, total } = await listStatusVisibility({ searchTerm: username, count, offset });
			const found = users.find((user) => user.username === username);

			if (found || !users.length || offset + users.length >= total) {
				return found;
			}
		}
	});
};

export const useManagedPresenceUser = (username?: string) => {
	const findManagedUser = useFindManagedUser();

	return useQuery({
		queryKey: managedPresenceQueryKeys.byUsername(username),
		enabled: Boolean(username),
		queryFn: async () => (username ? ((await findManagedUser(username)) ?? null) : null),
		meta: {
			apiErrorToastMessage: true,
		},
	});
};
