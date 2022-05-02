import type { ICallServerConfigData } from './voip';

export enum ServerType {
	MANAGEMENT = 'management',
	CALL_SERVER = 'call-server',
}

export interface IVoipServerConfigBase {
	type: ServerType;
	host: string;
	name: string;
}

export interface IVoipCallServerConfig extends IVoipServerConfigBase {
	type: ServerType.CALL_SERVER;
	configData: ICallServerConfigData;
}

export interface IVoipManagementServerConfig extends IVoipServerConfigBase {
	type: ServerType.MANAGEMENT;
	configData: IManagementConfigData;
}

export interface IManagementConfigData {
	port: number;
	username: string;
	password: string;
}

export const isICallServerConfigData = (obj: any): obj is ICallServerConfigData =>
	Number.isInteger(obj.websocketPort) && String(obj.websocketPath) === obj.websocketPath;
