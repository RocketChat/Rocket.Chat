import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export interface IModal {
	_id: string;
	title: string;
	content: string;
	contentType: 'markdown' | 'text';
	createdBy?: IUser['_id'];
	createdAt: Date;
	expires: Date | null;
	active: boolean;
}
