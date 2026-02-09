import type { IRocketChatRecord } from './IRocketChatRecord';
import type { Brand } from './utils';

export interface IWebdavAccount extends IRocketChatRecord {
	_id: string & Brand<'webdav-account-id'>;
	userId: string;
	serverURL: string;
	username: string;
	password?: string;
	name: string;
}

export type IWebdavAccountIntegration = Pick<IWebdavAccount, '_id' | 'username' | 'serverURL' | 'name'>;

export type IWebdavAccountPayload = Pick<IWebdavAccount, 'serverURL' | 'password' | 'name'> & Partial<Pick<IWebdavAccount, 'username'>>;

export interface IWebdavNode {
	basename: string;
	etag: string | null;
	filename: string;
	lastmod: string;
	mime?: string;
	size: number;
	type: 'file' | 'directory';
}
