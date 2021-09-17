import { IRocketChatRecord } from './IRocketChatRecord';

export enum ServerType {
	MANAGEMENT = 'management',
	CALL_SERVER = 'call-server',
}

export interface IVoipServerConfig extends IRocketChatRecord {
	type: ServerType;
	host: string;
	configData: IManagementConfigData | ICallServerConfigData;
}

export interface IManagementConfigData {
	port: number;
	serverName: string; // Internal name to be used in reports
	username: string;
	password: string;
}

export interface ICallServerConfigData {
	websocketPort: number;
	websocketPath: string;
	callServerName: string;
}
