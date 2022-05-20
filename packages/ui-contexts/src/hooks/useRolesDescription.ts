import { useCallback, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { AuthorizationContext, IRoles } from '../AuthorizationContext';

export const useRolesDescription = (): ((ids: Array<string>) => [string]) => {
	const { roleStore } = useContext(AuthorizationContext);

	const subscription = useMemo(
		() => ({
			getCurrentValue: (): IRoles => roleStore.roles,
			subscribe: (callback: () => void): (() => void) => {
				roleStore.on('change', callback);
				return (): void => {
					roleStore.off('change', callback);
				};
			},
		}),
		[roleStore],
	);

	const roles = useSubscription<IRoles>(subscription);

	return useCallback((values) => values.map((role) => roles[role]?.description || roles[role]?.name || role), [roles]) as (
		ids: Array<string>,
	) => [string];
};
