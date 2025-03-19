import { IRead, IHttp, IPersistence } from "../accessors";
import { AppMethod } from "../metadata";
import { ILivechatRoom } from "./ILivechatRoom";

/**
 * Handler called before a livechat room is created.
 *
 * To prevent the room from being created, the app should throw an `AppsEngineException`
 */
export interface IPreLivechatRoomCreatePrevent {
    /**
     * Method called *before* a livechat room is created.
     *
     * @param livechatRoom The livechat room which is about to be created
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persis An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    [AppMethod.EXECUTE_PRE_LIVECHAT_ROOM_CREATE_PREVENT](
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persis: IPersistence
    ): Promise<void>;
}
