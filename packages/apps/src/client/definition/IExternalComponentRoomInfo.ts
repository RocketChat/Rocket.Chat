import type { IExternalComponentUserInfo } from './IExternalComponentUserInfo';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

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
