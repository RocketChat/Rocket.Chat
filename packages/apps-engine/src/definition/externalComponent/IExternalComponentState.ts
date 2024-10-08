import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from '../../client/definition';

/**
 * The state of an external component, which contains the
 * current user's information and the current room's information.
 */
export interface IExternalComponentState {
    /**
     * The user who opened this external component
     */
    currentUser: IExternalComponentUserInfo;
    /**
     * The room where the external component belongs to
     */
    currentRoom: IExternalComponentRoomInfo;
}
