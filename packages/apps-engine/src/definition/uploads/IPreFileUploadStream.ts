import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IFileUploadStreamContext } from './IFileUploadContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPreFileUploadStream`
 * event
 *
 * This event is triggered prior to an upload succesfully
 * being saved to the database, with a ReadableStream to the
 * contents of the file that is being uploaded.
 *
 * It is generally a recommended for the app NOT to load the entire
 * file contents into memory, but rather consume the stream and act upon
 * the chunks of data.
 *
 * To prevent the upload from completing, an app should throw a
 * `FileUploadNotAllowedException` with a message specifying the
 * reason for rejection.
 */
export interface IPreFileUploadStream {
	/**
	 * Event interface that allows an app to
	 * register as a handler of the `IPreFileUploadStream`
	 * event
	 *
	 * This event is triggered prior to an upload succesfully
	 * being saved to the database, with a ReadableStream to the
	 * contents of the file that is being uploaded.
	 *
	 * It is generally a recommended for the app NOT to load the entire
	 * file contents into memory, but rather consume the stream and act upon
	 * the chunks of data.
	 *
	 * To prevent the upload from completing, an app should throw a
	 * `FileUploadNotAllowedException` with a message specifying the
	 * reason for rejection.
	 */
	[AppMethod.EXECUTE_PRE_FILE_UPLOAD_STREAM](
		context: IFileUploadStreamContext,
		read: IRead,
		http: IHttp,
		persis: IPersistence,
		modify: IModify,
	): Promise<void>;
}
