import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export type ManagedPresenceUser = OperationResult<'GET', '/v1/users.listStatusVisibility'>['users'][number];

export const useManagedPresenceUsers = ({ searchTerm, count, offset }: { searchTerm: string; count: number; offset: number }) => {
	const listStatusVisibility = useEndpoint('GET', '/v1/users.listStatusVisibility');

	return useQuery({
		queryKey: ['admin', 'managed-presence-users', searchTerm, count, offset],
		queryFn: () => listStatusVisibility({ searchTerm, count, offset }),
		meta: {
			apiErrorToastMessage: true,
		},
	});
};
