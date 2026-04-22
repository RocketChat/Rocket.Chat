import type { IMedsenseRequest } from '@rocket.chat/core-typings';
import type { IMedsenseRequestsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, UpdateResult, Document, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MedsenseRequestsRaw extends BaseRaw<IMedsenseRequest> implements IMedsenseRequestsModel {
	constructor(db: Db) {
		super(db, 'medsense_requests');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { pharmacyId: 1 } }, { key: { status: 1 } }, { key: { roomId: 1 } }, { key: { pharmacyId: 1, status: 1 } }];
	}

	findPendingByPharmacyId(pharmacyId: string): FindCursor<IMedsenseRequest> {
		return this.find(
			{ pharmacyId, status: { $in: ['invite_sent', 'waiting_patient', 'ai_preassessment', 'after_hours', 'waiting_staff', 'ready_for_staff'] } },
			{ sort: { createdAt: 1 } },
		);
	}

	findTakenByPharmacyId(pharmacyId: string): FindCursor<IMedsenseRequest> {
		return this.find({ pharmacyId, status: 'taken' }, { sort: { takenAt: -1 } });
	}

	findClosedByPharmacyId(pharmacyId: string, limit = 50): FindCursor<IMedsenseRequest> {
		return this.find({ pharmacyId, status: 'closed' }, { sort: { closedAt: -1 }, limit });
	}

	async createRequest(data: Omit<IMedsenseRequest, '_id' | '_updatedAt'>): Promise<string> {
		const result = await this.insertOne({
			...data,
			_updatedAt: new Date(),
		});
		return result.insertedId;
	}

	attachRoom(requestId: string, roomId: string, status: IMedsenseRequest['status']): Promise<UpdateResult | Document> {
		return this.updateOne(
			{ _id: requestId },
			{
				$set: {
					roomId,
					status,
					_updatedAt: new Date(),
				},
				$unset: {
					creationError: 1,
				},
			},
		);
	}

	markRoomCreateFailed(requestId: string, errorMessage?: string): Promise<UpdateResult | Document> {
		const $set: Partial<IMedsenseRequest> & { _updatedAt: Date } = {
			status: 'failed_room_create',
			_updatedAt: new Date(),
		};

		if (errorMessage) {
			$set.creationError = errorMessage;
		}

		return this.updateOne(
			{ _id: requestId },
			{
				$set,
			},
		);
	}

	markTaken(requestId: string, userId: string, username: string): Promise<UpdateResult | Document> {
		return this.updateOne(
			{ _id: requestId },
			{
				$set: {
					status: 'taken',
					takenBy: { _id: userId, username },
					takenAt: new Date(),
					_updatedAt: new Date(),
				},
			},
		);
	}

	markClosed(requestId: string, userId: string, username: string): Promise<UpdateResult | Document> {
		return this.updateOne(
			{ _id: requestId },
			{
				$set: {
					status: 'closed',
					closedBy: { _id: userId, username },
					closedAt: new Date(),
					_updatedAt: new Date(),
				},
			},
		);
	}

	findActiveByRoomId(roomId: string): Promise<IMedsenseRequest | null> {
		return this.findOne({ roomId, status: { $in: ['invite_sent', 'waiting_patient', 'ai_preassessment', 'after_hours', 'waiting_staff', 'ready_for_staff', 'taken'] } });
	}

	updateAssessmentProgress(
		requestId: string,
		data: Partial<
			Pick<IMedsenseRequest, 'answers' | 'contextSummary' | 'patientStage' | 'currentStepId' | 'status' | 'flowId' | 'aiSummary' | 'aiFollowUpCount'>
		>,
	): Promise<UpdateResult | Document> {
		return this.updateOne(
			{ _id: requestId },
			{
				$set: {
					...data,
					_updatedAt: new Date(),
				},
			},
		);
	}
}
