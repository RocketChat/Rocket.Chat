import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { ILivechatDepartmentEventContext } from './ILivechatEventContext';

/**
 * Handler called after the disablement of a livechat department.
 */
export interface IPostLivechatDepartmentDisabled {
    /**
     * Handler called *after* the disablement of a livechat department.
     *
     * @param data the livechat context data which contains the department disabled
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persis An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    [AppMethod.EXECUTE_POST_LIVECHAT_DEPARTMENT_DISABLED](
        context: ILivechatDepartmentEventContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify?: IModify,
    ): Promise<void>;
}
