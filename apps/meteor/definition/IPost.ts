import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export interface IPost extends IRocketChatRecord {
	createdAt: Date;
	authorId: IUser['_id'];
	content: string;
}
