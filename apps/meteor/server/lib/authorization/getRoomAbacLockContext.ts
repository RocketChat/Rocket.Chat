import type { RoomAbacLockContext } from '../../../lib/rooms/isRoomAbacLocked';
import { settings } from '../../settings';

export const getRoomAbacLockContext = (): RoomAbacLockContext => ({
	enforcementOn: Boolean(settings.get('ABAC_Enabled')) && Boolean(settings.get('ABAC_Enforce_All_Rooms')),
	requiredAttributeKeys: settings.get<string[]>('ABAC_Required_Attributes') ?? [],
});
