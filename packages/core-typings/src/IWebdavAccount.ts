import type { IRocketChatRecord } from "./IRocketChatRecord";

export interface IWebdavAccount extends IRocketChatRecord {
	userId: string;
	serverURL: string;
	username: string;
	password: string;
	name: string;
}

export type IWebdavAccountPayload = Pick<
	IWebdavAccount,
	'_id' | 'username' | 'serverURL' | 'name'
>;
