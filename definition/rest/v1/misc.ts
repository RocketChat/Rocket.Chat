export type MiscEndpoints = {
	'stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};
};
