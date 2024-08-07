import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IRoom } from './IRoom';

export interface IPreRoomDeletePrevent {
    /**
     * Checks whether the handler actually shall execute.
     * This method can basically implement a filter.
     *
     * @param room The room which was being deleted
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @return whether to run the execute or not
     */
    checkPreRoomDeletePrevent?(room: IRoom, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to prevent a room from being deleted.
     *
     * @param room The room about to be deleted
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns whether to prevent the room from being deleted
     */
    executePreRoomDeletePrevent(room: IRoom, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean>;
}
