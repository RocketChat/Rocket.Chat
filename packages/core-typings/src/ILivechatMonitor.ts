export interface ILivechatMonitor {
	_id: string;
	name: string;
	username: string;
	email?: string;
	enabled: boolean;
	numMonitors: number;
	type: string;
	visibility: string;
}
