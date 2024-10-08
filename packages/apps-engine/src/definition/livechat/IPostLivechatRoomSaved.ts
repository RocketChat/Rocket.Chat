import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { ILivechatRoom } from './ILivechatRoom';

/**
 * Handler called after the room's info get saved.
 */
export interface IPostLivechatRoomSaved {
    /**
     * Handler called *after* the room's info get saved.
     *
     * @param data the livechat context data which contains room's info.
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persis An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    [AppMethod.EXECUTE_POST_LIVECHAT_ROOM_SAVED](context: ILivechatRoom, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
