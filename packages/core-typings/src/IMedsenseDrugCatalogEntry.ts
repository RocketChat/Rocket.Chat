import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IMedsenseDrugCatalogEntry extends IRocketChatRecord {
	_id: string;
	code: string;
	displayName: string;
	searchText: string;
	sourceVersion: string;
	active: boolean;
	createdAt: Date;
	_updatedAt: Date;
}
