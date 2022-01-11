import { IRocketChatRecord } from './IRocketChatRecord';

export interface IAppsPersistenceModel extends IRocketChatRecord {
	appId: string;
	associations: Record<string, any>;
	data: Record<string, any>;
}
