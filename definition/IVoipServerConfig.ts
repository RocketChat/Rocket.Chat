import { IRocketChatRecord } from './IRocketChatRecord';

export enum ServerType {
	MANAGEMENT = 'management',
	CALLS = 'calls',
}

export interface IVoipServerConfig extends IRocketChatRecord {
	type: ServerType;
	host: string;
	port: number;
}
