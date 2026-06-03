import type {
	IMediaCall,
	RocketChatRecordDeleted,
	MediaCallActorType,
	MediaCallSignedContact,
	MediaCallContact,
	IUser,
	MediaCallActor,
} from '@rocket.chat/core-typings';
import type { IMediaCallsModel } from '@rocket.chat/model-typings';
import type {
	IndexDescription,
	Collection,
	Db,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	FindOptions,
	Document,
	FindCursor,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MediaCallsRaw extends BaseRaw<IMediaCall> implements IMediaCallsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IMediaCall>>) {
		super(db, 'media_calls', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { createdAt: 1 }, unique: false },
			{ key: { ended: 1, uids: 1, expiresAt: 1 }, unique: false },
			{
				key: { 'caller.type': 1, 'caller.id': 1, 'callerRequestedId': 1 },
				sparse: true,
			},
		];
	}

	public async findOneByIdAndCallee<T extends Document = IMediaCall>(
		id: IMediaCall['_id'],
		callee: MediaCallActor,
		options?: FindOptions<IMediaCall>,
	): Promise<T | null> {
		return this.findOne<T>(
			{
				'_id': id,
				'callee.type': callee.type,
				'callee.id': callee.id,
				...(callee.contractId && { 'callee.contractId': callee.contractId }),
			},
			options,
		);
	}

	public async findOneByCallerRequestedId<T extends Document = IMediaCall>(
		id: Required<IMediaCall>['callerRequestedId'],
		caller: { type: MediaCallActorType; id: string },
		options?: FindOptions<T>,
	): Promise<T | null> {
		return this.findOne(
			{
				'caller.type': caller.type,
				'caller.id': caller.id,
				'callerRequestedId': id,
			},
			options,
		);
	}

	public updateOneById(
		_id: string,
		update: UpdateFilter<IMediaCall> | Partial<IMediaCall>,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
		return this.updateOne({ _id }, update, options);
	}

	public async startRingingById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: 'none',
			},
			{ $set: { state: 'ringing', expiresAt } },
		);
	}

	public async acceptCallById(
		callId: string,
		data: { calleeContractId: string; supportedFeatures: string[] },
		expiresAt: Date,
	): Promise<UpdateResult> {
		const { calleeContractId } = data;

		return this.updateOne(
			{
				_id: callId,
				state: { $in: ['none', 'ringing'] },
			},
			{
				$set: {
					'state': 'accepted',
					'callee.contractId': calleeContractId,
					'acceptedAt': new Date(),
					expiresAt,
				},
				$pull: {
					features: {
						$nin: data.supportedFeatures,
					},
				},
			},
		);
	}

	public async activateCallById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: 'accepted',
			},
			{
				$set: {
					state: 'active',
					activatedAt: new Date(),
					expiresAt,
				},
			},
		);
	}

	public async hangupCallById(callId: string, params?: { endedBy?: IMediaCall['endedBy']; reason?: string }): Promise<UpdateResult> {
		const { endedBy, reason } = params || {};

		return this.updateOne(
			{
				_id: callId,
				ended: false,
			},
			{
				$set: {
					state: 'hangup',
					ended: true,
					endedAt: new Date(),
					...(endedBy && { endedBy }),
					...(reason && { hangupReason: reason }),
				},
			},
		);
	}

	public async setExpiresAtById(callId: string, expiresAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				ended: false,
			},
			{
				$set: { expiresAt },
			},
		);
	}

	public async transferCallById(callId: string, params: { by: MediaCallSignedContact; to: MediaCallContact }): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: callId,
				state: {
					$in: ['accepted', 'active'],
				},
				transferredAt: {
					$exists: false,
				},
			},
			{
				$set: {
					transferredAt: new Date(),
					transferredBy: params.by,
					transferredTo: params.to,
				},
			},
		);
	}

	public findAllExpiredCalls<T extends Document = IMediaCall>(options?: FindOptions<T>): FindCursor<T> {
		return this.find(
			{
				ended: false,
				expiresAt: {
					$lte: new Date(),
				},
			},
			options,
		);
	}

	public findAllNotOverByUid<T extends Document = IMediaCall>(uid: IUser['_id'], options?: FindOptions<T>): FindCursor<T> {
		return this.find(
			{
				ended: false,
				expiresAt: {
					$gt: new Date(),
				},
				uids: uid,
				// Exclude group calls the user has already left. We keep `uids`
				// intact across leaves so call history still includes them, so
				// the "is this user currently in this call?" check has to look
				// at the participants array.
				participants: { $not: { $elemMatch: { id: uid, leftAt: { $exists: true } } } } as any,
			},
			options,
		);
	}

	public async hasUnfinishedCalls(): Promise<boolean> {
		const count = await this.countDocuments({ ended: false }, { limit: 1 });
		return count > 0;
	}

	public async hasUnfinishedCallsByUid(uid: IUser['_id'], exceptCallId?: string): Promise<boolean> {
		const count = await this.countDocuments(
			{
				ended: false,
				uids: uid,
				participants: { $not: { $elemMatch: { id: uid, leftAt: { $exists: true } } } } as any,
				...(exceptCallId && { _id: { $ne: exceptCallId } }),
			},
			{ limit: 1 },
		);
		return count > 0;
	}

	/**
	 * All group calls currently considered "active" (not ended, not expired).
	 * Used by the reconciliation cron to find candidates to verify against
	 * LiveKit's actual room presence.
	 */
	public findActiveGroupCalls<T extends Document = IMediaCall>(options?: FindOptions<T>): FindCursor<T> {
		return this.find(
			{
				kind: 'group',
				ended: false,
				expiresAt: { $gt: new Date() },
			} as any,
			options as FindOptions<IMediaCall>,
		) as unknown as FindCursor<T>;
	}

	/**
	 * Find a call by its recording egress id. Used by the LiveKit webhook
	 * handler to locate the right call doc when an egress event arrives —
	 * the egress payload only carries the egress id, not our internal callId.
	 */
	public async findOneByRecordingEgressId<T extends Document = IMediaCall>(egressId: string, options?: FindOptions<T>): Promise<T | null> {
		return this.findOne<T>({ 'recording.egressId': egressId } as any, options as FindOptions<IMediaCall>);
	}

	/**
	 * Find the currently-active group call in a room, if any. Used by the
	 * channel-header banner ("Active call — Join") and to deduplicate when
	 * multiple users try to start a call simultaneously.
	 */
	public async findActiveGroupCallInRoom<T extends Document = IMediaCall>(rid: string, options?: FindOptions<T>): Promise<T | null> {
		return this.findOne<T>(
			{
				rid,
				kind: 'group',
				ended: false,
			} as any,
			options as FindOptions<IMediaCall>,
		);
	}

	/**
	 * Append a participant to a group call's participants[] (idempotent via $addToSet on id).
	 */
	public async addGroupParticipant(
		callId: string,
		participant: { type: string; id: string; contractId?: string; displayName?: string; username?: string },
	): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: callId },
			{
				$pull: { participants: { id: participant.id } } as any,
			},
		).then(() =>
			this.updateOne(
				{ _id: callId },
				{
					$addToSet: { uids: participant.id },
					$push: { participants: { ...participant, joinedAt: new Date() } as any },
				},
			),
		);
	}

	/**
	 * Mark a participant as having left the group call. Idempotent.
	 */
	public async markGroupParticipantLeft(callId: string, userId: IUser['_id']): Promise<UpdateResult> {
		return this.updateOne({ '_id': callId, 'participants.id': userId } as any, { $set: { 'participants.$.leftAt': new Date() } } as any);
	}

	/**
	 * Toggle per-call transcription (take notes). When enabled, the agent's
	 * finals are persisted and a summary is posted at end of call. Stopping
	 * sets endedAt but does NOT clear the existing transcript entries —
	 * consistent with recording: pressing stop doesn't delete what's already
	 * captured.
	 */
	public async setTranscriptionEnabled(callId: string, enabled: boolean, byUserId?: string): Promise<UpdateResult> {
		if (enabled) {
			return this.updateOne(
				{ _id: callId },
				{
					$set: {
						transcription: {
							enabled: true,
							startedAt: new Date(),
							...(byUserId && { startedBy: byUserId }),
						},
					},
				},
			);
		}
		return this.updateOne({ _id: callId }, { $set: { 'transcription.enabled': false, 'transcription.endedAt': new Date() } } as any);
	}

	/**
	 * Append a finalized transcript entry to a call. Append-only. The agent
	 * fires one of these per finalized utterance from Gemini Live; the array
	 * is later read by the summary cron in chronological order.
	 */
	public async appendTranscriptEntry(
		callId: string,
		entry: { participantId: string; text: string; startedAt: Date; endedAt: Date },
	): Promise<UpdateResult> {
		return this.updateOne({ _id: callId }, { $push: { transcript: entry } as any });
	}

	/**
	 * Persist post-call summary metadata. Set once the summary message has
	 * been posted so retries don't double-post on subsequent cron passes.
	 */
	public async setSummaryById(callId: string, summary: { generatedAt: Date; messageId?: string }): Promise<UpdateResult> {
		return this.updateOne({ _id: callId }, { $set: { summary } });
	}

	public async findEndedCallsAwaitingSummary(): Promise<IMediaCall[]> {
		return this.find({
			kind: 'group',
			ended: true,
			summary: { $exists: false },
			transcript: { $exists: true, $not: { $size: 0 } },
		} as any).toArray();
	}
}
