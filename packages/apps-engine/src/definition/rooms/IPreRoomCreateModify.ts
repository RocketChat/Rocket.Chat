import type { IHttp, IPersistence, IRead, IRoomBuilder } from '../accessors';
import type { IRoom } from './IRoom';

/** Handler called when an App wants to modify a room in a destructive way. */
export interface IPreRoomCreateModify {
    /**
     * Checks whether the handler actually shall execute.
     * This method can basically implement a filter.
     *
     * @param room The room which was being created
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @return whether to run the execute or not
     */
    checkPreRoomCreateModify?(room: IRoom, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to prevent a room from being created.
     *
     * @param room The room about to be created
     * @param extend The builder for modifying the room via methods
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns the resulting room
     */
    executePreRoomCreateModify(room: IRoom, builder: IRoomBuilder, read: IRead, http: IHttp, persistence: IPersistence): Promise<IRoom>;
}
