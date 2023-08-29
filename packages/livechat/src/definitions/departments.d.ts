// TODO: Fully type departments in livechat
export type Department = {
	_id: string;
	name: string;
	showOnRegistration?: boolean;
	[key: string]: unknown;
};
