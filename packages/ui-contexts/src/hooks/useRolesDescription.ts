import { useCallback, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { IRoles } from '../AuthorizationContext';
import { AuthorizationContext } from '../AuthorizationContext';

export const useRolesDescription = (): ((ids: Array<string>) => [string]) => {
	const { roleStore } = useContext(AuthorizationContext);

	const [subscribe, getSnapshot] = useMemo(
		() => [
			(callback: () => void): (() => void) => {
				roleStore.on('change', callback);
				return (): void => {
					roleStore.off('change', callback);
				};
			},
			(): IRoles => roleStore.roles,
		],
		[roleStore],
	);

	const roles = useSyncExternalStore(subscribe, getSnapshot);

	return useCallback((values) => values.map((role) => roles[role]?.description || roles[role]?.name || role), [roles]) as (
		ids: Array<string>,
	) => [string];
};
