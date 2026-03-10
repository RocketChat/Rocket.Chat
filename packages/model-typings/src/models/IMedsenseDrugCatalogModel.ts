import type { FindCursor } from 'mongodb';
import type { IMedsenseDrugCatalogEntry } from '@rocket.chat/core-typings';
import type { IBaseModel } from './IBaseModel';

export interface IMedsenseDrugCatalogModel extends IBaseModel<IMedsenseDrugCatalogEntry> {
	searchActive(text?: string, limit?: number): FindCursor<IMedsenseDrugCatalogEntry>;
	findActiveByCodes(codes: string[]): FindCursor<IMedsenseDrugCatalogEntry>;
	replaceCatalog(
		sourceVersion: string,
		entries: Array<Pick<IMedsenseDrugCatalogEntry, 'code' | 'displayName' | 'searchText' | 'active'>>,
	): Promise<void>;
}
