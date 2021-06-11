export type LivechatDepartment = {
	GET: (params: {
		text?: string;
		enabled?: boolean;
		onlyMyDepartments?: boolean;
	}) => {
		departments: unknown[];
	};
};
