import { IMatrixBridgedUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixBridgedUserModel } from '@rocket.chat/model-typings';
import { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixBridgedUserRaw extends BaseRaw<IMatrixBridgedUser> implements IMatrixBridgedUserModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixBridgedUser>>) {
		super(db, 'matrix_bridged_users', trash);
	}

	async getExternalUserId(localUserId: string): Promise<string | null> {
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

	async getBridgedUserByLocalId(localUserId: string): Promise<IMatrixBridgedUser | null> {
		return this.findOne({ uid: localUserId });
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, mui: 1 }, unique: true, sparse: true }];
	}
}
