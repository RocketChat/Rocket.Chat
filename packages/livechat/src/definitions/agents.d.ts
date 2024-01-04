// TODO: Fully type agents in livechat
export type Agent = {
	name?: string;
	status?: string;
	email?: string;
	phone?: string;
	username: string;
	avatar?: {
		description: string;
		src: string;
	};
	[key: string]: unknown;
};
