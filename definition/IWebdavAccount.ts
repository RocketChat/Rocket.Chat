import { IRocketChatRecord } from './IRocketChatRecord';

export interface IWebdavAccount extends IRocketChatRecord {
	user_id: string;
	server_url: string;
	username: string;
	password: string;
	name: string;
}
