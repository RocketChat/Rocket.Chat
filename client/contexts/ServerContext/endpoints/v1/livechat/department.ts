export type LivechatDepartment = {
	GET: (params: {
		query: string;
	}) => {
		statuses: unknown[];
	};
};
