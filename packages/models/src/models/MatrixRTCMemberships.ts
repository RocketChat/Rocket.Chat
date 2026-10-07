import type { IMatrixRTCMembership, IUser, IVideoConference, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixRTCMembershipsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Document, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

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
			{ key: { mrid: 1, local: 1 } },
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

	findLocalByCallIdAndUid(callId: IVideoConference['_id'], uid: IUser['_id']): FindCursor<IMatrixRTCMembership> {
		return this.find({ callId, uid, local: true });
	}

	findLocalByCallId(callId: IVideoConference['_id']): FindCursor<IMatrixRTCMembership> {
		return this.find({ callId, local: true });
	}

	updateAnnouncementById(
		_id: IMatrixRTCMembership['_id'],
		{ eventId, expiresAt }: Pick<IMatrixRTCMembership, 'eventId' | 'expiresAt'>,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { eventId, expiresAt } });
	}

	findRemoteByRoom(mrid: string): FindCursor<IMatrixRTCMembership> {
		return this.find({ mrid, local: false });
	}

	findRemoteRoomIds(): Promise<string[]> {
		return this.col.distinct('mrid', { local: false });
	}

	upsertRemote({ joinedAt, ...membership }: Omit<IMatrixRTCMembership, '_id' | '_updatedAt' | 'callId' | 'local'>): Promise<UpdateResult> {
		const { mrid, userId, mode } = membership;
		const key = mode === 'compatibility' ? { stateKey: membership.stateKey } : { memberId: membership.memberId };

		return this.updateOne(
			{ mrid, userId, mode, local: false, ...key },
			{ $set: { ...membership, local: false }, $setOnInsert: { joinedAt } },
			{ upsert: true },
		);
	}

	attachSessionToCall(mrid: string, slotId: string, callId: IVideoConference['_id'], now = new Date()): Promise<UpdateResult | Document> {
		return this.updateMany({ mrid, slotId, callId: { $ne: callId }, expiresAt: { $gt: now } }, { $set: { callId } });
	}

	setNotificationById(
		_id: IMatrixRTCMembership['_id'],
		notification: NonNullable<IMatrixRTCMembership['notification']>,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { notification } });
	}

	findOneByNotificationEventId(eventId: string): Promise<IMatrixRTCMembership | null> {
		return this.findOne({ 'notification.eventId': eventId });
	}

	findOneRemoteRinging(callId: IVideoConference['_id'], userId: string): Promise<IMatrixRTCMembership | null> {
		return this.findOne({ callId, 'local': false, 'notification.userIds': userId }, { sort: { _updatedAt: -1 } });
	}
}
