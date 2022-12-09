import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type { Collection, Db, Document, FindOptions, DistinctOptions, UpdateResult, UpdateFilter, ModifyResult } from 'mongodb';
import type {
	ILivechatInquiryRecord,
	IMessage,
	RocketChatRecordDeleted,
	OmnichannelSortingMechanismSettingType,
} from '@rocket.chat/core-typings';
import { LivechatInquiryStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';
import { getInquirySortQuery } from '../../../app/livechat/server/lib/inquiries';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiryRecord> implements ILivechatInquiryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>) {
		super(db, 'livechat_inquiry', trash);
	}

	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.QUEUED,
		};
		return this.findOne(query) as unknown as Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	}

	findOneByRoomId<T = ILivechatInquiryRecord>(
		rid: string,
		options: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null> {
		const query = {
			rid,
		};
		return this.findOne(query, options);
	}

	getDistinctQueuedDepartments(options: DistinctOptions): Promise<string[]> {
		return this.col.distinct('department', { status: LivechatInquiryStatus.QUEUED }, options);
	}

	async setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | null> {
		const updated = await this.findOneAndUpdate({ _id: inquiryId }, { $set: { department } }, { returnDocument: 'after' });
		return updated?.value;
	}

	async setLastMessageByRoomId(rid: string, message: IMessage): Promise<UpdateResult> {
		return this.updateOne({ rid }, { $set: { lastMessage: message } });
	}

	async findNextAndLock(department?: string): Promise<ILivechatInquiryRecord | null> {
		const date = new Date();
		const result = await this.col.findOneAndUpdate(
			{
				status: LivechatInquiryStatus.QUEUED,
				...(department && { department }),
				$or: [
					{
						locked: true,
						lockedAt: {
							$lte: new Date(date.getTime() - 5000),
						},
					},
					{
						locked: false,
					},
					{
						locked: { $exists: false },
					},
				],
			},
			{
				$set: {
					locked: true,
					// apply 5 secs lock lifetime
					lockedAt: new Date(),
				},
			},
			{
				sort: {
					estimatedWaitingTimeQueue: 1,
					estimatedServiceTimeAt: 1,
				},
			},
		);

		return result.value;
	}

	async unlock(inquiryId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: inquiryId }, { $unset: { locked: 1, lockedAt: 1 } });
	}

	async unlockAll(): Promise<UpdateResult | Document> {
		return this.updateMany(
			{ $or: [{ lockedAt: { $exists: true } }, { locked: { $exists: true } }] },
			{ $unset: { locked: 1, lockedAt: 1 } },
		);
	}

	async getCurrentSortedQueueAsync({
		inquiryId,
		department,
		queueSortBy,
	}: {
		inquiryId?: string;
		department: string;
		queueSortBy: OmnichannelSortingMechanismSettingType;
	}): Promise<Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number }> {
		const filter: UpdateFilter<ILivechatInquiryRecord>[] = [
			{
				$match: {
					status: 'queued',
					...(department && { department }),
				},
			},
			{ $sort: getInquirySortQuery(queueSortBy) },
			{
				$group: {
					_id: 1,
					inquiry: {
						$push: {
							_id: '$_id',
							rid: '$rid',
							name: '$name',
							ts: '$ts',
							status: '$status',
							department: '$department',
						},
					},
				},
			},
			{
				$unwind: {
					path: '$inquiry',
					includeArrayIndex: 'position',
				},
			},
			{
				$project: {
					_id: '$inquiry._id',
					rid: '$inquiry.rid',
					name: '$inquiry.name',
					ts: '$inquiry.ts',
					status: '$inquiry.status',
					department: '$inquiry.department',
					position: 1,
				},
			},
		];

		// To get the current room position in the queue, we need to apply the next $match after the $project
		if (inquiryId) {
			filter.push({ $match: { _id: inquiryId } });
		}

		return this.col
			.aggregate(filter, {
				readPreference: readSecondaryPreferred(),
			})
			.toArray() as unknown as Promise<
			Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number }
		>;
	}

	setEstimatedServiceTimeAt(
		_rid: string,
		_data: { estimatedWaitingTimeQueue: number; estimatedServiceTimeAt: string },
	): Promise<ModifyResult<ILivechatInquiryRecord>> {
		throw new Error('Method not implemented on the community edition.');
	}
}
