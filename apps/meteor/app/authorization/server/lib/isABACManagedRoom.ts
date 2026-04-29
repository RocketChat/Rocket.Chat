import type { IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

export const isABACManagedRoom = (room: Pick<IRoom, 't' | 'abacAttributes'>): boolean =>
	room.t === 'p' && settings.get<boolean>('ABAC_Enabled') && Array.isArray(room?.abacAttributes) && room.abacAttributes.length > 0;
