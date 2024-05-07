import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IWebdavAccount extends IRocketChatRecord {
	userId: string;
	serverURL: string;
	username: string;
	password?: string;
	name: string;
}

export type IWebdavAccountIntegration = Pick<IWebdavAccount, '_id' | 'username' | 'serverURL' | 'name'>;

export type IWebdavAccountPayload = Pick<IWebdavAccount, 'serverURL' | 'password' | 'name'> & Partial<Pick<IWebdavAccount, 'username'>>;

export type IWebdavNode = {
	basename: string;
	etag: string | null;
	filename: string;
	lastmod: string;
	mime?: string;
	size: number;
	type: 'file' | 'directory';
};
