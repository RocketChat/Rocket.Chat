export type Guest = {
	token: string;
	name?: string;
	email?: string;
	[key: string]: unknown;
};
