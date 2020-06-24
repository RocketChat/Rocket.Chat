export interface IImportUser {
	_id?: string;

	username?: string;
	emails: Array<string>;
	importIds: Array<string>;
	name?: string;
	utcOffset?: number;
	active?: boolean;
	avatarUrl?: string;
	deleted?: boolean;
	statusText?: string;
	roles?: Array<string>;
	type: 'user' | 'bot';
	bio?: string;
}
