import type { IMedsenseDrugCatalogEntry } from '@rocket.chat/core-typings';
import type { IMedsenseDrugCatalogModel } from '@rocket.chat/model-typings';
import type { Db, Filter, FindCursor, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class MedsenseDrugCatalogRaw extends BaseRaw<IMedsenseDrugCatalogEntry> implements IMedsenseDrugCatalogModel {
	constructor(db: Db) {
		super(db, 'medsense_drug_catalog');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { code: 1 }, unique: true },
			{ key: { active: 1, displayName: 1 } },
			{ key: { sourceVersion: 1 } },
		];
	}

	searchActive(text?: string, limit = 50): FindCursor<IMedsenseDrugCatalogEntry> {
		const selector: Filter<IMedsenseDrugCatalogEntry> = { active: true };
		const trimmed = typeof text === 'string' ? text.trim() : '';

		if (trimmed) {
			selector.$or = [
				{ displayName: { $regex: escapeRegExp(trimmed), $options: 'i' } },
				{ searchText: { $regex: escapeRegExp(trimmed.toLowerCase()), $options: 'i' } },
				{ code: { $regex: escapeRegExp(trimmed), $options: 'i' } },
			] as any;
		}

		return this.find(selector, {
			sort: { displayName: 1 },
			limit,
		});
	}

	findActiveByCodes(codes: string[]): FindCursor<IMedsenseDrugCatalogEntry> {
		if (!codes.length) {
			return this.find({ _id: '__none__' });
		}

		return this.find(
			{
				code: { $in: codes },
				active: true,
			},
			{
				sort: { displayName: 1 },
			},
		);
	}

	async replaceCatalog(
		sourceVersion: string,
		entries: Array<Pick<IMedsenseDrugCatalogEntry, 'code' | 'displayName' | 'searchText' | 'active'>>,
	): Promise<void> {
		const now = new Date();
		const operations = entries.map((entry) => ({
			updateOne: {
				filter: { code: entry.code },
				update: {
					$set: {
						displayName: entry.displayName,
						searchText: entry.searchText,
						sourceVersion,
						active: entry.active,
						_updatedAt: now,
					},
					$setOnInsert: {
						createdAt: now,
					},
				},
				upsert: true,
			},
		}));

		if (operations.length) {
			await this.col.bulkWrite(operations, { ordered: false });
		}

		await this.updateMany(
			{
				sourceVersion: { $ne: sourceVersion },
			},
			{
				$set: {
					active: false,
					_updatedAt: now,
				},
			},
		);
	}
}
