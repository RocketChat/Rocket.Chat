import type { IUploadDetails } from './IUploadDetails';

/**
 * Context handed to an `IPreFileMessageConfirm` handler: the file whose message
 * is about to be posted, and the accompanying message text (caption), if any.
 */
export interface IFileMessageConfirmContext {
	file: IUploadDetails;
	messageText: string;
}
