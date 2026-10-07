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
	'/v1/media-calls.selectDevice': {
		POST: (params: { deviceId?: string }) => {
			device: { id: string; appId: string; name?: string } | null;
		};
	};
};
