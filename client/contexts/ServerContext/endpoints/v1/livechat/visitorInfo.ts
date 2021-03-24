export type LivechatVisitorInfoEndpoint = {
	GET: (visitorId: string) => {
		success: boolean;
		visitor: {
			visitorEmails: Array<{
				address: string;
			}>;
		};
	};
};
