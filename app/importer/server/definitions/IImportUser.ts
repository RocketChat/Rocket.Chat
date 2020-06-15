export interface IImportUser {
	id?: string;

	importData?: {
		id?: string;
	};

	username?: string;
	email: string;
	name?: string;
	utcOffset?: number;
	active?: boolean;
	avatarUrl?: string;
}
