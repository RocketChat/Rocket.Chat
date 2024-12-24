import type { IImport } from '@rocket.chat/core-typings';
import type { IImportsModel } from '@rocket.chat/model-typings';
import type { Db, Document, FindCursor, FindOptions, UpdateResult, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ImportsModel extends BaseRaw<IImport> implements IImportsModel {
	constructor(db: Db) {
		super(db, 'import');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { ts: -1 } }, { key: { valid: 1 } }];
	}

	async findLastImport(): Promise<IImport | undefined> {
		const imports = await this.find({}, { sort: { ts: -1 }, limit: 1 }).toArray();

		return imports.shift();
	}

	async hasValidOperationInStatus(allowedStatus: IImport['status'][]): Promise<boolean> {
		return Boolean(
			await this.findOne(
				{
					valid: { $ne: false },
					status: { $in: allowedStatus },
				},
				{ projection: { _id: 1 } },
			),
		);
	}

	invalidateAllOperations(): Promise<UpdateResult | Document> {
		return this.updateMany({ valid: { $ne: false } }, { $set: { valid: false } });
	}

	invalidateOperationsExceptId(id: string): Promise<UpdateResult | Document> {
		return this.updateMany({ valid: { $ne: false }, _id: { $ne: id } }, { $set: { valid: false } });
	}

	findAllPendingOperations(options: FindOptions<IImport> = {}): FindCursor<IImport> {
		return this.find({ valid: true }, options);
	}

	async increaseTotalCount(id: string, recordType: 'users' | 'channels' | 'messages', increaseBy = 1): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: id },
			{
				$inc: {
					'count.total': increaseBy,
					[`count.${recordType}`]: increaseBy,
				},
			},
		);
	}

	async setOperationStatus(id: string, status: IImport['status']): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: id },
			{
				$set: {
					status,
				},
			},
		);
	}
}
