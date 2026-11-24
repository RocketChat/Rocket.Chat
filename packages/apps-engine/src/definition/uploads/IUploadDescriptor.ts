import type { IRoom } from '../rooms';
import type { IUser } from '../users';

export interface IUploadDescriptor {
	/**
	 * Full filename of the file, including extension name
	 */
	filename: string;
	/**
	 * The room where the file to be uploaded
	 */
	room: IRoom;
	/**
	 * The user that performed the upload
	 *
	 * NOTE: please ignore this property if you are going
	 * to assign a livechat visitor to perform upload.
	 */
	user?: IUser | null;
	/**
	 * The token of a Livechat visitor
	 */
	visitorToken?: string;
	/**
	 * The id of the thread's parent message. When set, the file
	 * message posts as a reply in that thread.
	 *
	 * NOTE: not supported for uploads by a Livechat visitor.
	 */
	threadId?: string;
}
