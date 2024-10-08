import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessageReportContext } from './IMessageReportContext';

/**
 * Handler for after a message report
 */
export interface IPostMessageReported {
    /**
     * Method called *after* the message has been reported.
     *
     * @param context The context of the report
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    executePostMessageReported(context: IMessageReportContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
