import type { IMatrixBridgedRoom, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixBridgedRoomModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixBridgedRoomRaw extends BaseRaw<IMatrixBridgedRoom> implements IMatrixBridgedRoomModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixBridgedRoom>>) {
		super(db, 'matrix_bridged_rooms', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { rid: 1 }, unique: true, sparse: true },
			{ key: { mri: 1 }, unique: true, sparse: true },
			{ key: { fromServer: 1 }, sparse: true },
		];
	}

	async getExternalRoomId(localRoomId: string): Promise<string | null> {
		const bridgedRoom = await this.findOne({ rid: localRoomId });

		return bridgedRoom ? bridgedRoom.mri : null;
	}

	async getLocalRoomId(externalRoomId: string): Promise<string | null> {
		const bridgedRoom = await this.findOne({ mri: externalRoomId });

		return bridgedRoom ? bridgedRoom.rid : null;
	}

	async removeByLocalRoomId(localRoomId: string): Promise<void> {
		await this.deleteOne({ rid: localRoomId });
	}

	async createOrUpdateByLocalRoomId(localRoomId: string, externalRoomId: string, fromServer: string): Promise<void> {
		await this.updateOne({ rid: localRoomId }, { $set: { rid: localRoomId, mri: externalRoomId, fromServer } }, { upsert: true });
	}

	async getExternalServerConnectedExcluding(exclude: string): Promise<string[]> {
		const externalServers = await this.col.distinct('fromServer');

		return externalServers.filter((serverName) => serverName !== exclude);
	}
}
