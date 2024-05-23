export type FreeSwitchExtension = {
	extension: string;
	context?: string;
	domain?: string;
	groups: string[];
	status: 'UNKNOWN' | 'REGISTERED' | 'UNREGISTERED';
	contact?: string;
	callGroup?: string;
	callerName?: string;
	callerNumber?: string;
};
