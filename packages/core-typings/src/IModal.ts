import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IModal extends IRocketChatRecord {
	title: string;
	content: string;
	contentType: 'html' | 'text';
	createdBy?: IUser['_id'];
	createdAt: Date;
	expires: Date | null;
	status: boolean; // active or inactive
	users: Array<{
		userId: IUser['_id'];
		createdAt: Date;
	}>;
}
