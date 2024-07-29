import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { ILivechatEventContext } from './ILivechatEventContext';

/**
 * Handler called after the assignment of a livechat agent.
 */
export interface IPostLivechatAgentAssigned {
    /**
     * Handler called *after* the assignment of a livechat agent.
     *
     * @param data the livechat context data which contains agent's info and room's info.
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persis An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    [AppMethod.EXECUTE_POST_LIVECHAT_AGENT_ASSIGNED](
        context: ILivechatEventContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify?: IModify,
    ): Promise<void>;
}
