export type ListEndpoint = {
	GET: (params: { query: string }) => {
		statuses: unknown[];
	};
};
