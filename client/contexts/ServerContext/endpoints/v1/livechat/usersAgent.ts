export type LivechatUsersAgentEndpoint = {
	GET: (params?: { text?: string; offset?: number; count?: number; sort?: string }) => {
		users: {
			_id: string;
			emails: {
				address: string;
				verified: boolean;
			}[];
			status: string;
			name: string;
			username: string;
			statusLivechat: string;
			livechat: {
				maxNumberSimultaneousChat: number;
			};
		}[];
		count: number;
		offset: number;
		total: number;
		success: boolean;
	};
};
