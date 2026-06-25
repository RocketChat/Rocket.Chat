export type MediaCallsEndpoints = {
	'/v1/media-calls.escalate': {
		POST: (params: { callId: string }) => {
			providerName: string;
			url: string;
		};
	};
};
