import type { LockableRoom, RoomLockContext } from '@rocket.chat/core-typings';
import { isRoomLocked } from '@rocket.chat/core-typings';

import { settings } from '../../settings';

/**
 * Resolves the workspace policy for the shared `isRoomLocked` predicate (ABAC-P4 §7.1).
 *
 * Placed alongside `isABACManagedRoom`, which is the settings-aware wrapper for the sibling
 * predicate, so both live at the same layer.
 *
 * No license check is needed here: `ABAC_Enforce_All_Rooms` is an enterprise setting declared with
 * `invalidValue: false`, so an unlicensed workspace already reads it as `false`. On a workspace
 * where the `abac` module never registered the setting at all, `settings.get` returns `undefined`,
 * which is equally falsy — so enforcement is off by construction rather than by a guard someone
 * has to remember to write.
 */
export const getRoomLockContext = (): RoomLockContext => ({
	enforcementOn: Boolean(settings.get('ABAC_Enabled')) && Boolean(settings.get('ABAC_Enforce_All_Rooms')),
	requiredAttributeKeys: settings.get<string[]>('ABAC_Required_Attributes') ?? [],
});

/** True when ABAC enforcement is on and this room is non-compliant. */
export const isRoomLockedByAbac = (room: LockableRoom): boolean => isRoomLocked(room, getRoomLockContext());
