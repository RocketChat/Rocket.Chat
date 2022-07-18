import { IMatrixBridgedRoom, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixBridgedRoomModel } from '@rocket.chat/model-typings';
import { Collection, Db, IndexDescription } from 'mongodb';
import { BaseRaw } from './BaseRaw';

export class MatrixBridgedRoomRaw extends BaseRaw<IMatrixBridgedRoom> implements IMatrixBridgedRoomModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixBridgedRoom>>) {
		super(db, 'matrix_bridged_rooms', trash);
	}
       
	protected modelIndexes(): IndexDescription[] {
		return [
            { key: { rid: 1, mri: 1 }, unique: true, sparse: true },
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

}
