export type MiscEndpoints = {
	'/v1/stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};
};
