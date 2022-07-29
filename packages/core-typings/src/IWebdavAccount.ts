import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IWebdavAccount extends IRocketChatRecord {
	userId: string;
	serverURL: string;
	username: string;
	password: string;
	name: string;
}

export type IWebdavAccountPayload = Pick<IWebdavAccount, 'serverURL' | 'username' | 'password' | 'name'>;

export type IWebdavNode = {
	basename: string;
	etag: string;
	filename: string;
	lastmod: string;
	mime: string;
	size: number;
	type: 'file' | 'directory';
};
