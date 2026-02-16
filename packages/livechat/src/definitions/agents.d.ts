// TODO: Fully type agents in livechat
export type Agent = {
	_id: string;
	username?: string;
	name?: string;
	status?: string;
	emails?: Array<{ address: string }>;
	phone?: Array<{ phoneNumber: string }>;
	customFields?: { phone?: string };
	avatar?: {
		description: string;
		src: string;
	};
	ts?: number;
	[key: string]: unknown;
};
