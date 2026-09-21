import type { RoomAbacLockContext } from '../../../lib/rooms/isRoomAbacLocked';
import { settings } from '../../settings';

/**
 * No license check needed: `ABAC_Enforce_All_Rooms` is declared `invalidValue: false`, and without
 * the `abac` module it was never registered, so `settings.get` returns `undefined`.
 */
export const getRoomAbacLockContext = (): RoomAbacLockContext => ({
	enforcementOn: Boolean(settings.get('ABAC_Enabled')) && Boolean(settings.get('ABAC_Enforce_All_Rooms')),
	requiredAttributeKeys: settings.get<string[]>('ABAC_Required_Attributes') ?? [],
});
