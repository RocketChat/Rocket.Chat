export interface IImportUser {
	// #ToDo: Remove this _id, as it isn't part of the imported data
	_id?: string;

	username?: string;
	emails: Array<string>;
	importIds: Array<string>;
	name?: string;
	utcOffset?: number;
	avatarUrl?: string;
	deleted?: boolean;
	statusText?: string;
	roles?: Array<string>;
	type: 'user' | 'bot';
	bio?: string;

	services?: Record<string, Record<string, any>>;
	customFields?: Record<string, any>;

	password?: string;
	voipExtension?: string;
	federated?: boolean;
}
