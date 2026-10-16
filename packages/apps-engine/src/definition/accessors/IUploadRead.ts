import type { IUpload } from '../uploads';

/**
 * Reads files stored on the workspace.
 *
 * `getById` describes a file; the two buffer calls fetch its contents from
 * whichever `StoreType` holds it. It needs the `upload.read` permission.
 */
export interface IUploadRead {
	getById(id: string): Promise<IUpload>;
	getBufferById(id: string): Promise<Buffer>;
	getBuffer(upload: IUpload): Promise<Buffer>;
}
