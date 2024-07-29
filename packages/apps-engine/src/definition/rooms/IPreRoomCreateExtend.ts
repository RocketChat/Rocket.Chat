import type { IHttp, IPersistence, IRead, IRoomExtender } from '../accessors';
import type { IRoom } from './IRoom';

/** Handler called when an App wants to enrich a room. */
export interface IPreRoomCreateExtend {
    /**
     * Checks whether the handler actually shall execute.
     * This method can basically implement a filter.
     *
     * @param room The room which was being created
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @return whether to run the execute or not
     */
    checkPreRoomCreateExtend?(room: IRoom, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to prevent a room from being created.
     *
     * @param room The room about to be created
     * @param extend An accessor for modifying the room non-destructively
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns the resulting room
     */
    executePreRoomCreateExtend(room: IRoom, extend: IRoomExtender, read: IRead, http: IHttp, persistence: IPersistence): Promise<IRoom>;
}
