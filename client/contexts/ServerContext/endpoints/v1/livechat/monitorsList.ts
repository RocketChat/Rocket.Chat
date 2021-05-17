export type LivechatMonitorsList = {
	GET: (params: {
		query: string;
	}) => {
		statuses: unknown[];
	};
};
