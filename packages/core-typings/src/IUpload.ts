import { StoreType } from '@rocket.chat/apps-engine/definition/uploads';
import { IVisitor } from '@rocket.chat/core-typings/src';
import { IUser } from '@rocket.chat/core-typings/src';
import { IRoom } from '@rocket.chat/core-typings/src';
import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IUpload extends IRocketChatRecord {
	typeGroup?: string;
	type?: string;
	name: string;
	aliases?: string;
	extension?: string;
	complete?: boolean;
	uploading?: boolean;
	progress?: number;

	id: string;
	size: string;
	etag: string;
	path: string;
	token: string;
	url: string;
	updatedAt: Date;
	uploadedAt: Date;
	store: StoreType;
	room: IRoom;
	visitor?: IVisitor;
	user?: IUser;
}
