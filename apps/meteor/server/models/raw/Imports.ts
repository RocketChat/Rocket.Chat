import type { Db, Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';
import type { IImportsModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class ImportsModel extends BaseRaw<any> implements IImportsModel {
	constructor(db: Db) {
		super(db, 'import');
	}

	async findLastImport(): Promise<any | undefined> {
		const imports = await this.find({}, { sort: { ts: -1 }, limit: 1 }).toArray();

		if (imports?.length) {
			return imports.shift();
		}

		return undefined;
	}

	invalidateAllOperations(): Promise<UpdateResult | Document> {
		return this.updateMany({ valid: { $ne: false } }, { $set: { valid: false } });
	}

	invalidateOperationsExceptId(id: string): Promise<UpdateResult | Document> {
		return this.updateMany({ valid: { $ne: false }, _id: { $ne: id } }, { $set: { valid: false } });
	}

	invalidateOperationsNotInStatus(status: string | string[]): Promise<UpdateResult | Document> {
		const statusList = ([] as string[]).concat(status);

		return this.updateMany({ valid: { $ne: false }, status: { $nin: statusList } }, { $set: { valid: false } });
	}

	findAllPendingOperations(options: FindOptions<any> = {}): FindCursor<any> {
		return this.find({ valid: true }, options);
	}
}
