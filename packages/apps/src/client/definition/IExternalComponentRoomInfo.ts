import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms/index.js';

import type { IExternalComponentUserInfo } from './IExternalComponentUserInfo.js';

type ClientRoomInfo = Pick<IRoom, 'id' | 'slugifiedName'>;

/**
 * Represents the room's information returned to the
 * external component.
 */
export interface IExternalComponentRoomInfo extends ClientRoomInfo {
	/**
	 * the list that contains all the users belonging
	 * to this room.
	 */
	members: Array<IExternalComponentUserInfo>;
}
