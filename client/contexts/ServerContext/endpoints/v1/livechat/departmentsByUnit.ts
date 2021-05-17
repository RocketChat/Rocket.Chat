export type LivechatDepartmentsByUnit = {
	GET: (params: {
		query: string;
	}) => {
		statuses: unknown[];
	};
};
