import type { IMatrixRTCMembership, IUser, IVideoConference, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixRTCMembershipsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindCursor, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixRTCMembershipsRaw extends BaseRaw<IMatrixRTCMembership> implements IMatrixRTCMembershipsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMatrixRTCMembership>>) {
		super(db, 'matrix_rtc_memberships', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { mrid: 1, slotId: 1, expiresAt: 1 } },
			{ key: { callId: 1, uid: 1 } },
			{ key: { expiresAt: 1 } },
		];
	}

	findActiveBySession(mrid: string, slotId: string, now = new Date()): FindCursor<IMatrixRTCMembership> {
		return this.find({ mrid, slotId, expiresAt: { $gt: now } });
	}

	findActiveByCallId(callId: IVideoConference['_id'], now = new Date()): FindCursor<IMatrixRTCMembership> {
		return this.find({ callId, expiresAt: { $gt: now } });
	}

	findOneActiveLocal(callId: IVideoConference['_id'], uid: IUser['_id'], now = new Date()): Promise<IMatrixRTCMembership | null> {
		return this.findOne({ callId, uid, local: true, expiresAt: { $gt: now } }, { sort: { joinedAt: -1 } });
	}

	findExpired(now = new Date()): FindCursor<IMatrixRTCMembership> {
		return this.find({ expiresAt: { $lte: now } });
	}
}
