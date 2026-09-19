import type { IRoom } from '../rooms';
import type { IUser } from '../users';

/**
 * What an App has to say about a file before `IModifyCreator.uploadCreator`
 * stores it.
 *
 * Name the uploader either way round: pass `user` for a workspace user, or
 * `visitorToken` for a Livechat visitor.
 */
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
}
