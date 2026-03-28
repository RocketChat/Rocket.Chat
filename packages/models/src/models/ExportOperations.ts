import type { IExportOperation, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IExportOperationsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, UpdateResult, Filter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ExportOperationsRaw extends BaseRaw<IExportOperation> implements IExportOperationsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IExportOperation>>) {
		super(db, 'export_operations', trash);
	}
	markAsSkipped(id: IExportOperation['_id']): Promise<UpdateResult> {
    return this.updateOne({ _id: id }, { $set: { status: 'skipped' } });
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1 } }, { key: { status: 1 } }];
	}

	findOnePending(): Promise<IExportOperation | null> {
		const query: Filter<IExportOperation> = {
			status: { $nin: ['completed', 'skipped', 'failed'] },
		};

		return this.findOne(query);
	}

	async create(data: IExportOperation): Promise<string> {
		const result = await this.insertOne({
			...data,
			createdAt: new Date(),
		});

		return result.insertedId;
	}

	findLastOperationByUser(userId: string, fullExport = false): Promise<IExportOperation | null> {
		const query = {
			userId,
			fullExport,
		};

		return this.findOne(query, { sort: { createdAt: -1 } });
	}

	findAllPendingBeforeMyRequest(requestDay: Date): FindCursor<IExportOperation> {
		const query: Filter<IExportOperation> = {
			status: { $nin: ['completed', 'skipped', 'failed'] },
			createdAt: { $lt: requestDay },
		};

		return this.find(query);
	}

	countAllPendingBeforeMyRequest(requestDay: Date): Promise<number> {
		const query: Filter<IExportOperation> = {
			status: { $nin: ['completed', 'skipped', 'failed'] },
			createdAt: { $lt: requestDay },
		};

		return this.countDocuments(query);
	}

	updateOperation(data: IExportOperation): Promise<UpdateResult> {
		const update = {
			$set: {
				 _updatedAt: new Date(),
				roomList: data.roomList,
				status: data.status,
				failReason: data.failReason, 
				fileList: data.fileList,
				generatedFile: data.generatedFile,
				generatedFileName: data.generatedFileName,
				fileId: data.fileId,
				userNameTable: data.userNameTable,
				userData: data.userData,
				generatedUserFile: data.generatedUserFile,
				generatedAvatar: data.generatedAvatar,
				exportPath: data.exportPath,
				assetsPath: data.assetsPath,
			},
		};

		return this.updateOne({ _id: data._id }, update);
	}
}
