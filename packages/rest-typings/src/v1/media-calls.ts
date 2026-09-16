export type MediaCallsEndpoints = {
	'/v1/media-calls.escalate': {
		POST: (params: { callId: string }) => {
			providerName: string;
			url: string;
		};
	};
	'/v1/media-calls.devices': {
		GET: () => {
			devices: { id: string; name: string; appId: string }[];
		};
	};
};
