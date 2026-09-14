import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IUser } from './IUser';

export type ContactSource = 'outlook' | 'manual';

export interface IContactPhone {
	// As it came from the source, kept for display.
	raw: string;
	// E.164, the reverse lookup key for caller id. Absent when `raw` carried no resolvable country.
	e164?: string;
	label?: string;
}

export interface IContactEmail {
	address: string;
}

/**
 * A personal contact. Distinct from `ILivechatContact`
 */
export interface IContact extends IRocketChatRecord {
	uid: IUser['_id'];
	source: ContactSource;
	displayName: string;
	givenName?: string;
	surname?: string;
	companyName?: string;
	emails: IContactEmail[];
	phones: IContactPhone[];
	categories: string[];
	externalId?: string;
	folderId?: string;
	lastSyncAt?: Date;
}
