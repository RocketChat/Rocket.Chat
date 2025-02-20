import type { IEmailDescriptor, IPreEmailSentContext } from '.';
import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';

/**
 * Event interface that allows apps to
 * register as a handler of of the `IPreEmailSent`
 * event.
 *
 * This event is trigger before the mailer sends
 * an email.
 *
 * To prevent the email from being sent, you can
 * throw an error with a message specifying the
 * reason for rejection.
 */
export interface IPreEmailSent {
    [AppMethod.EXECUTE_PRE_EMAIL_SENT](
        context: IPreEmailSentContext,
        read: IRead,
        http: IHttp,
        persis: IPersistence,
        modify: IModify,
    ): Promise<IEmailDescriptor>;
}
