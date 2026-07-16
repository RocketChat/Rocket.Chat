import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IFileMessageConfirmContext } from './IFileMessageConfirmContext';

/**
 * Event interface that allows an app to register as a handler of the
 * `IPreFileMessageConfirm` event.
 *
 * Unlike `IPreFileUpload` (which fires when the file *blob* is uploaded, at
 * attach time), this event fires when the file *message* is about to be posted
 * (at send time). It lets an app confirm or cancel the send — e.g. by opening
 * a server-initiated modal and awaiting the user's choice.
 *
 * @returns `true` to allow the message to be posted, `false` to cancel it.
 */
export interface IPreFileMessageConfirm {
	[AppMethod.EXECUTE_PRE_FILE_MESSAGE_CONFIRM](
		context: IFileMessageConfirmContext,
		read: IRead,
		http: IHttp,
		persis: IPersistence,
		modify: IModify,
	): Promise<boolean>;
}
