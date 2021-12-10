import { IRocketChatRecord } from './IRocketChatRecord';

export interface IWebdavAccount extends IRocketChatRecord {
	userId: string;
	serverURL: string;
	username: string;
	password: string;
	name: string;
}

declare let { userId, _id, _updatedAt, ...rest }: IWebdavAccount;

export type IWebdavAccountPayload = typeof rest
