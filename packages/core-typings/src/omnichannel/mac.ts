export type MACStats = {
	contactsCount: number;
	conversationsCount: number;
	sources: { source: string; contactsCount: number; conversationsCount: number }[];
};
