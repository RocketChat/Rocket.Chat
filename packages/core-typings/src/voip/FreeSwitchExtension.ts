export type FreeSwitchExtension = {
	extension: string;
	context?: string;
	domain?: string;
	group?: string;
	status: 'UNKNOWN' | 'REGISTERED' | 'UNREGISTERED';
	contact?: string;
	callGroup?: string;
	callerName?: string;
	callerNumber?: string;
};
