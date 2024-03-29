// TODO: Fully type agents in livechat
export type Agent = {
	_id: string;
	username: string;
	name?: string;
	status?: string;
	email?: string;
	phone?: string;
	username: string;
	avatar?: {
		description: string;
		src: string;
	};
	ts: number;
	[key: string]: unknown;
};
