import { IRocketChatRecord } from './IRocketChatRecord';

export enum ServerType {
	MANAGEMENT = 'management',
	CALL_SERVER = 'call-server',
}

export interface IVoipServerConfig extends IRocketChatRecord {
	type: ServerType;
	host: string;
	name: string;
	configData: IManagementConfigData | ICallServerConfigData;
	active: boolean;
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

export const isICallServerConfigData = (obj: any): obj is ICallServerConfigData =>
	Number.isInteger(obj.websocketPort) && String(obj.websocketPath) === obj.websocketPath;
