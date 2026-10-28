import type { IRole } from '@rocket.chat/core-typings';
import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

/**
 * Returns a function that maps a role reference to a role id.
 *
 * Authorization checks such as `queryRole` match on `IRole._id`. The default roles
 * are seeded with `_id === name`, but a custom role gets a random id, so its name
 * never matches. Use this resolver whenever the caller only knows the role name —
 * an app that declares an action button filter, for example.
 *
 * A known id wins over a name, so an existing caller that already passes an id is
 * unaffected. An unknown value passes through unchanged, which keeps the failure
 * mode of the check it feeds.
 */
export const useRoleIdResolver = (): ((role: string) => IRole['_id']) => {
	const { getRoles, subscribeToRoles } = useContext(AuthorizationContext);

	const roles = useSyncExternalStore(subscribeToRoles, getRoles);

	const idsByName = useMemo(() => {
		const index = new Map<IRole['name'], IRole['_id']>();
		for (const role of roles.values()) {
			// `roles.create` and `roles.update` reject a name already taken by another role, so a
			// name maps to at most one role. Should duplicates still exist (e.g. written straight
			// to the database), the first one iterated wins instead of the last, so adding another
			// duplicate later does not silently repoint every check that names it.
			if (index.has(role.name)) {
				continue;
			}

			index.set(role.name, role._id);
		}
		return index;
	}, [roles]);

	return useCallback((role: string) => (roles.has(role) ? role : (idsByName.get(role) ?? role)), [idsByName, roles]);
};
