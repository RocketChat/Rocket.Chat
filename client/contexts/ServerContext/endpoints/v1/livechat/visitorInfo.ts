export type LivechatVisitorInfoEndpoint = {
	GET: (params: { visitorId: string }) => {
		success: boolean;
		visitor: {
			visitorEmails: Array<{
				address: string;
			}>;
		};
	};
};
