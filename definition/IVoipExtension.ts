export enum EndpointState {
	UNKNOWN = 'unknown',
	REGISTERED = 'registered',
	UNREGISTERED = 'unregistered'
}
export interface IVoipExtensionBase {
	name: string;
	state: EndpointState;
}
export interface IVoipExtensionConfig extends IVoipExtensionBase{
	authType: string;
	password: string;
}
