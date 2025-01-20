import type { IMatrixBridgedUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixBridgedUserModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixBridgedUserRaw extends BaseRaw<IMatrixBridgedUser> implements IMatrixBridgedUserModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixBridgedUser>>) {
		super(db, 'matrix_bridged_users', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { uid: 1 }, unique: true, sparse: true },
			{ key: { mui: 1 }, unique: true, sparse: true },
			{ key: { fromServer: 1 }, sparse: true },
		];
	}

	async getExternalUserIdByLocalUserId(localUserId: string): Promise<string | null> {
		const bridgedUser = await this.findOne({ uid: localUserId });

		return bridgedUser ? bridgedUser.mui : null;
	}

	async getBridgedUserByExternalUserId(externalUserId: string): Promise<IMatrixBridgedUser | null> {
		return this.findOne({ mui: externalUserId });
	}

	async getLocalUserIdByExternalId(externalUserId: string): Promise<string | null> {
		const bridgedUser = await this.findOne({ mui: externalUserId });

		return bridgedUser ? bridgedUser.uid : null;
	}

	async getLocalUsersByExternalIds(externalUserIds: string[]): Promise<IMatrixBridgedUser[]> {
		const bridgedUsers = await this.find({ mui: { $in: externalUserIds } }).toArray();

		return bridgedUsers;
	}

	async getBridgedUserByLocalId(localUserId: string): Promise<IMatrixBridgedUser | null> {
		return this.findOne({ uid: localUserId });
	}

	async createOrUpdateByLocalId(localUserId: string, externalUserId: string, remote: boolean, fromServer: string): Promise<void> {
		await this.updateOne(
			{ uid: localUserId },
			{
				$set: {
					uid: localUserId,
					mui: externalUserId,
					remote,
					fromServer,
				},
			},
			{ upsert: true },
		);
	}
}
