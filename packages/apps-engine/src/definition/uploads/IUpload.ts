import type { IVisitor } from '../livechat';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { StoreType } from './StoreType';

/**
 * A file stored on the workspace, as `IUploadRead` returns it.
 *
 * Read the contents with `IUploadRead.getBufferById`: the fields here describe
 * the file, they do not carry it.
 */
export interface IUpload {
	/** The upload's identifier. */
	id: string;
	/** The file name shown to users, including its extension. */
	name: string;
	/** The file's size in bytes. */
	size: string;
	/** The file's MIME type. */
	type: string;
	/** The file name's extension, without the dot. */
	extension: string;
	/** The store's entity tag for the contents, which changes when they do. */
	etag: string;
	/** Where the contents sit in the configured store. */
	path: string;
	/** The store's token for this file. */
	token: string;
	/** Where a client downloads the file from. */
	url: string;
	/** How much of the file has arrived. */
	progress: number;
	/** Whether the contents are still arriving. */
	uploading: boolean;
	/** Whether the file is stored and ready to be served. */
	complete: boolean;
	/** When the record last changed. */
	updatedAt: Date;
	/** When the upload started. */
	uploadedAt: Date;
	/** Which backend holds the contents. */
	store: StoreType;
	/** The room the file was uploaded to. */
	room: IRoom;
	/** The Livechat visitor who uploaded the file, when a visitor did. */
	visitor?: IVisitor;
	/** The user who uploaded the file, when a user did. */
	user?: IUser;
}
