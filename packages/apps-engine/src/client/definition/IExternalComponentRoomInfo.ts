import type { IRoom } from '../../definition/rooms';
import type { IExternalComponentUserInfo } from './IExternalComponentUserInfo';

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
