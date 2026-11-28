import { useSetting } from '@rocket.chat/ui-contexts';

import { useIsABACAvailable } from '../../admin/ABAC/hooks/useIsABACAvailable';

export const useIsAbacEnforcementOn = (): boolean => {
	const isABACAvailable = useIsABACAvailable();
	const enforceAllRooms = useSetting('ABAC_Enforce_All_Rooms', false);

	return isABACAvailable && enforceAllRooms;
};
