export type LicensesMaxActiveUsersEndpoint = {
	GET: (params: void) => { maxActiveUsers: number | null; activeUsers: number };
};
