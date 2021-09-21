import { IRocketChatRecord } from './IRocketChatRecord';

export enum ServerType {
	MANAGEMENT = 'management',
	CALL_SERVER = 'call-server',
}

export interface IVoipServerConfig extends IRocketChatRecord {
	type: ServerType;
	host: string;
	serverName: string;
	configData: IManagementConfigData | ICallServerConfigData;
	configActive: boolean;
}

export interface IManagementConfigData {
	port: number;
	username: string;
	password: string;
}

export interface ICallServerConfigData {
	websocketPort: number;
	websocketPath: string;
}
