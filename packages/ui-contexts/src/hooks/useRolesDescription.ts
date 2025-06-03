import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

import type { IRoles } from '../AuthorizationContext';
import { AuthorizationContext } from '../AuthorizationContext';

export const useRolesDescription = () => {
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

	return useCallback((ids: string[]) => ids.map((role) => roles[role]?.description || roles[role]?.name || role), [roles]);
};
