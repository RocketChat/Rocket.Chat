export interface IImportUserIdentification {
	id?: string;
}

export interface IImportUser {
	id?: string;

	username?: string;
	email: string;
	name?: string;
	utcOffset?: number;
	active?: boolean;
	avatarUrl?: string;
}
