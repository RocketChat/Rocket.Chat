import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IFileUploadContext } from './IFileUploadContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPreFileUpload`
 * event
 *
 * This event is triggered prior to an upload succesfully
 * being saved to the database, but *after* all its contents
 * have been retrieved by Rocket.Chat.
 *
 * To prevent the upload from completing, an app should throw a
 * `FileUploadNotAllowedException` with a message specifying the
 * reason for rejection.
 */
export interface IPreFileUpload {
    [AppMethod.EXECUTE_PRE_FILE_UPLOAD](context: IFileUploadContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
