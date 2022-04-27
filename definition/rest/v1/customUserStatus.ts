export type CustomUserStatusEndpoints = {
	'custom-user-status.list': {
		GET: (params: { query: string }) => {
			statuses: unknown[];
		};
	};
};
