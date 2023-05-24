export type PresenceEndpoints = {
	'/v1/presence.getConnections': {
		GET: () => {
			current: number;
			max: number;
		};
	};
	'/v1/presence.enableBroadcast': {
		POST: () => void;
	};
};
