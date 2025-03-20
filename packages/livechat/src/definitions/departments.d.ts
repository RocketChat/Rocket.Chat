// TODO: Fully type departments in livechat
export type Department = {
	_id: string;
	name: string;
	showOnRegistration?: boolean;
	showOnOfflineForm?: boolean;
	departmentsAllowedToForward?: string[];
	[key: string]: unknown;
};
