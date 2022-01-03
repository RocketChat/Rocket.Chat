import { Cursor, UpdateWriteOpResult } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IExportOperation } from '../../../../definition/IExportOperation';

type T = IExportOperation;

export class ExportOperationsRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [{ key: { userId: 1 } }, { key: { status: 1 } }];

	findOnePending(): Promise<T | null> {
		const query = {
			status: { $nin: ['completed', 'skipped'] },
		};

		return this.findOne(query);
	}

	async create(data: T): Promise<string> {
		const result = await this.insertOne({
			...data,
			createdAt: new Date(),
		});

		return result.insertedId;
	}

	findLastOperationByUser(userId: string, fullExport = false): Promise<T | null> {
		const query = {
			userId,
			fullExport,
		};

		return this.findOne(query, { sort: { createdAt: -1 } });
	}

	findAllPendingBeforeMyRequest(requestDay: Date): Cursor<T> {
		const query = {
			status: { $nin: ['completed', 'skipped'] },
			createdAt: { $lt: requestDay },
		};

		return this.find(query);
	}

	updateOperation(data: T): Promise<UpdateWriteOpResult> {
		const update = {
			$set: {
				roomList: data.roomList,
				status: data.status,
				fileList: data.fileList,
				generatedFile: data.generatedFile,
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
