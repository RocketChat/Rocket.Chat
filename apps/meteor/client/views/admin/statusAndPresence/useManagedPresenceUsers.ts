import type { IUser, Serialized } from '@rocket.chat/core-typings';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { managedPresenceQueryKeys } from '../../../lib/queryKeys';

export type ManagedPresenceUser = OperationResult<'GET', '/v1/users.listStatusVisibility'>['users'][number];

const toManagedPresenceUser = ({
	_id,
	username,
	name,
	status,
	statusText,
	presenceDisabledByAdmin,
	statusVisibilityDeniedByAdmin,
}: Serialized<IUser>): ManagedPresenceUser => ({
	_id,
	username,
	name,
	status,
	statusText,
	presenceDisabledByAdmin: presenceDisabledByAdmin === true,
	statusVisibilityDeniedByAdmin: statusVisibilityDeniedByAdmin ?? [],
});

export const hasAdminStatusRules = (user?: { presenceDisabledByAdmin?: boolean; statusVisibilityDeniedByAdmin?: string[] }): boolean =>
	Boolean(user?.presenceDisabledByAdmin || user?.statusVisibilityDeniedByAdmin?.length);

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

export const useManagedPresenceUser = (username?: string) => {
	const getUserInfo = useEndpoint('GET', '/v1/users.info');

	return useQuery({
		queryKey: managedPresenceQueryKeys.byUsername(username),
		enabled: Boolean(username),
		queryFn: async () => (username ? toManagedPresenceUser((await getUserInfo({ username })).user) : null),
		meta: {
			apiErrorToastMessage: true,
		},
	});
};
