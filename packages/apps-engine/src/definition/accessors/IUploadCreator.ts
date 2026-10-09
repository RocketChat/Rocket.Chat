import type { IUpload } from '../uploads';
import type { IUploadDescriptor } from '../uploads/IUploadDescriptor';

/**
 * Stores a file on the workspace as though a user had uploaded it.
 *
 * It needs the `upload.write` permission.
 */
export interface IUploadCreator {
	/**
	 * Create an upload to a room
	 *
	 * @param buffer A Buffer with the file's content (See [here](https://nodejs.org/api/buffer.html)
	 * @param descriptor The metadata about the upload
	 */
	uploadBuffer(buffer: Buffer, descriptor: IUploadDescriptor): Promise<IUpload>;
}
