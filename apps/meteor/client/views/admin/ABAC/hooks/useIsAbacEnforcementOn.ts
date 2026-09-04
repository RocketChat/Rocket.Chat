import { useSetting } from '@rocket.chat/ui-contexts';

import { useIsABACAvailable } from './useIsABACAvailable';

/**
 * Whether ABAC enforcement is in effect for this workspace (ABAC-P4 M1).
 *
 * `ABAC_Enforce_All_Rooms` is gated on `ABAC_Enabled` by an `enableQuery`, but that governs the
 * admin field rather than the stored value, so both are read here — the same pairing the server
 * resolver does in `server/lib/authorization/isRoomLocked.ts`.
 */
export const useIsAbacEnforcementOn = (): boolean => {
	const isABACAvailable = useIsABACAvailable();
	const enforceAllRooms = useSetting('ABAC_Enforce_All_Rooms', false);

	return isABACAvailable && enforceAllRooms;
};
