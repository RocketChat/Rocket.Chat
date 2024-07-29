import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IRoom } from './IRoom';

/** Handler for after a room is created. */
export interface IPostRoomCreate {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for after the room
     * has been created.
     *
     * @param room The room which was created
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @return whether to run the execute or not
     */
    checkPostRoomCreate?(room: IRoom, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method called *after* the room has been created.
     *
     * @param room The room which was created
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     */
    executePostRoomCreate(room: IRoom, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
