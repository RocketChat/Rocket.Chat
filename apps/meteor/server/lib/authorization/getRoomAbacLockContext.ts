import type { RoomAbacLockContext } from '../../../lib/rooms/isRoomAbacLocked';
import { settings } from '../../settings';

export const getRoomAbacLockContext = (): RoomAbacLockContext => ({
	enforcementOn: settings.get<boolean>('ABAC_Enabled') && settings.get<boolean>('ABAC_Enforce_All_Rooms'),
	requiredAttributeKeys: settings.get<string[]>('ABAC_Required_Attributes') ?? [],
});
