import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { ILivechatRoom } from './ILivechatRoom';

/**
 * Handler called after a livechat room is started.
 */
export interface IPostLivechatRoomStarted {
    /**
     * Method called *after* a livechat room is started.
     *
     * @param livechatRoom The livechat room which is started.
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persis An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    [AppMethod.EXECUTE_POST_LIVECHAT_ROOM_STARTED](room: ILivechatRoom, read: IRead, http: IHttp, persis: IPersistence, modify?: IModify): Promise<void>;
}
