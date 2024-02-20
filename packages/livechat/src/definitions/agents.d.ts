// TODO: Create a widget specific type for the agent on core-typings
export type Agent = {
	_id: string;
	name?: string;
	status?: string;
	email?: string;
	emails: { address: string; verified: boolean }[];
	phone?: { phoneNumber: string }[];
	username: string;
	avatar?: {
		description: string;
		src: string;
	};
	customFields?: { phone?: string };
};
