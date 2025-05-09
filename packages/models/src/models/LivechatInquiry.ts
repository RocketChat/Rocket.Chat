import type { ILivechatInquiryRecord, IMessage, RocketChatRecordDeleted, ILivechatPriority } from '@rocket.chat/core-typings';
import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type {
	Collection,
	Db,
	Document,
	FindOptions,
	UpdateResult,
	Filter,
	DeleteResult,
	IndexDescription,
	FindCursor,
	UpdateFilter,
	DeleteOptions,
	AggregateOptions,
	WithId,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiryRecord> implements ILivechatInquiryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>) {
		super(db, 'livechat_inquiry', trash);
	}

	protected modelIndexes(): Array<IndexDescription> {
		return [
			{
				key: {
					rid: 1,
				},
			},
			{
				key: {
					name: 1,
				},
			},
			{
				key: {
					message: 1,
				},
			},
			{
				key: {
					ts: 1,
				},
			},
			{
				key: {
					department: 1,
				},
			},
			{
				key: {
					status: 1,
				},
			},
			{
				key: {
					priorityId: 1,
					priorityWeight: 1,
				},
				sparse: true,
			},
			{
				key: {
					priorityWeight: 1,
					ts: 1,
				},
				partialFilterExpression: {
					status: { $eq: LivechatInquiryStatus.QUEUED },
				},
			},
			{
				key: {
					estimatedWaitingTimeQueue: 1,
					ts: 1,
				},
				partialFilterExpression: {
					status: { $eq: LivechatInquiryStatus.QUEUED },
				},
			},
			{
				key: {
					'v.token': 1,
					'status': 1,
				},
			},
			{
				key: {
					locked: 1,
					lockedAt: 1,
				},
				sparse: true,
			},
			{ key: { 'v._id': 1 } },
		];
	}

	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.QUEUED,
		};
		return this.findOne(query) as unknown as Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	}

	findOneByRoomId<T extends Document = ILivechatInquiryRecord>(
		rid: string,
		options?: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null> {
		const query = {
			rid,
		};
		return this.findOne(query, options);
	}

	findOneReadyByRoomId<T extends Document = ILivechatInquiryRecord>(
		rid: string,
		options?: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.READY,
		};

		return this.findOne(query, options);
	}

	findIdsByVisitorToken(token: ILivechatInquiryRecord['v']['token']): FindCursor<ILivechatInquiryRecord> {
		return this.find({ 'v.token': token }, { projection: { _id: 1 } });
	}

	getDistinctQueuedDepartments(options: AggregateOptions): Promise<{ _id: string | null }[]> {
		return this.col
			.aggregate<{ _id: string | null }>(
				[
					{ $match: { status: LivechatInquiryStatus.QUEUED } },
					{
						$group: {
							_id: '$department',
						},
					},
				],
				options,
			)
			.toArray();
	}

	async setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | null> {
		return this.findOneAndUpdate({ _id: inquiryId }, { $set: { department } }, { returnDocument: 'after' });
	}

	/**
	 * Updates the `lastMessage` of inquiries that are not taken yet, after they're taken we only need to update room's `lastMessage`
	 */
	async setLastMessageByRoomId(rid: ILivechatInquiryRecord['rid'], message: IMessage): Promise<ILivechatInquiryRecord | null> {
		return this.findOneAndUpdate(
			{ rid, status: { $ne: LivechatInquiryStatus.TAKEN } },
			{ $set: { lastMessage: message } },
			{ returnDocument: 'after' },
		);
	}

	async setLastMessageById(inquiryId: string, lastMessage: IMessage): Promise<UpdateResult> {
		return this.updateOne({ _id: inquiryId }, { $set: { lastMessage } });
	}

	async findNextAndLock(
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'],
		department: string | null,
	): Promise<ILivechatInquiryRecord | null> {
		const date = new Date();
		return this.findOneAndUpdate(
			{
				status: LivechatInquiryStatus.QUEUED,
				...(department ? { department } : { department: { $exists: false } }),
				$or: [
					{
						locked: true,
						lockedAt: {
							$lte: new Date(date.getTime() - 5000),
						},
					},
					{
						locked: { $ne: true },
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
				sort: queueSortBy,
			},
		);
	}

	async unlock(inquiryId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: inquiryId }, { $unset: { locked: 1, lockedAt: 1 } });
	}

	async unlockAll(): Promise<UpdateResult | Document> {
		return this.updateMany(
			{ locked: { $exists: true } },
			{ $unset: { locked: 1, lockedAt: 1 }, $set: { status: LivechatInquiryStatus.QUEUED, queuedAt: new Date() } },
		);
	}

	async getCurrentSortedQueueAsync({
		inquiryId,
		department,
		queueSortBy,
	}: {
		inquiryId?: string;
		department?: string;
		queueSortBy: FindOptions<ILivechatInquiryRecord>['sort'];
	}): Promise<(Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number })[]> {
		const filter: Filter<ILivechatInquiryRecord>[] = [
			{
				$match: {
					status: 'queued',
					...(department && { department }),
				},
			},
			{ $sort: queueSortBy },
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
			.aggregate<Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number }>(filter, {
				readPreference: readSecondaryPreferred(),
			})
			.toArray();
	}

	setSlaForRoom(_rid: string, _data: { estimatedWaitingTimeQueue: number; slaId: string }): Promise<null | WithId<ILivechatInquiryRecord>> {
		throw new Error('Method not implemented on the community edition.');
	}

	unsetSlaForRoom(_roomId: string): Promise<null | WithId<ILivechatInquiryRecord>> {
		throw new Error('Method not implemented on the community edition.');
	}

	bulkUnsetSla(_roomIds: string[]): Promise<Document | UpdateResult> {
		throw new Error('Method not implemented on the community edition.');
	}

	setPriorityForRoom(_rid: string, _priority: Pick<ILivechatPriority, '_id' | 'sortItem'>): Promise<null | WithId<ILivechatInquiryRecord>> {
		throw new Error('Method not implemented on the community edition.');
	}

	unsetPriorityForRoom(_rid: string): Promise<null | WithId<ILivechatInquiryRecord>> {
		throw new Error('Method not implemented on the community edition.');
	}

	async removeByRoomId(rid: string, options?: DeleteOptions): Promise<DeleteResult> {
		return this.deleteOne({ rid }, options);
	}

	getQueuedInquiries(options?: FindOptions<ILivechatInquiryRecord>): FindCursor<ILivechatInquiryRecord> {
		return this.find({ status: LivechatInquiryStatus.QUEUED }, options);
	}

	async takeInquiry(inquiryId: string): Promise<void> {
		await this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$set: { status: LivechatInquiryStatus.TAKEN, takenAt: new Date() },
				$unset: { defaultAgent: 1, estimatedInactivityCloseTimeAt: 1, queuedAt: 1 },
			},
		);
	}

	openInquiry(inquiryId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$set: { status: LivechatInquiryStatus.OPEN },
			},
		);
	}

	async queueInquiry(inquiryId: string, lastMessage?: IMessage): Promise<ILivechatInquiryRecord | null> {
		return this.findOneAndUpdate(
			{
				_id: inquiryId,
			},
			{
				$set: {
					status: LivechatInquiryStatus.QUEUED,
					queuedAt: new Date(),
					...(lastMessage && { lastMessage }),
				},
				$unset: { takenAt: 1 },
			},
			{ returnDocument: 'after' },
		);
	}

	queueInquiryAndRemoveDefaultAgent(inquiryId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$set: { status: LivechatInquiryStatus.QUEUED, queuedAt: new Date() },
				$unset: { takenAt: 1, defaultAgent: 1 },
			},
		);
	}

	readyInquiry(inquiryId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$set: {
					status: LivechatInquiryStatus.READY,
				},
			},
		);
	}

	async changeDepartmentIdByRoomId(rid: string, department: string): Promise<void> {
		const query = {
			rid,
		};
		const updateObj = {
			$set: {
				department,
			},
		};

		await this.updateOne(query, updateObj);
	}

	async getStatus(inquiryId: string): Promise<ILivechatInquiryRecord['status'] | undefined> {
		return (await this.findOne({ _id: inquiryId }))?.status;
	}

	updateVisitorStatus(token: string, status: ILivechatInquiryRecord['v']['status']): Promise<UpdateResult> {
		const query: Filter<ILivechatInquiryRecord> = {
			'v.token': token,
			'status': LivechatInquiryStatus.QUEUED,
		};

		const update: UpdateFilter<ILivechatInquiryRecord> = {
			$set: {
				'v.status': status,
			},
		};

		return this.updateOne(query, update);
	}

	setDefaultAgentById(inquiryId: string, defaultAgent: ILivechatInquiryRecord['defaultAgent']): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$set: {
					defaultAgent,
				},
			},
		);
	}

	async setStatusById(inquiryId: string, status: LivechatInquiryStatus): Promise<ILivechatInquiryRecord> {
		const result = await this.findOneAndUpdate(
			{ _id: inquiryId },
			{ $set: { status } },
			{
				upsert: true,
				returnDocument: 'after',
			},
		);

		if (!result) {
			throw new Error('error-failed-to-set-inquiry-status');
		}

		return result;
	}

	setNameByRoomId(rid: string, name: string): Promise<UpdateResult> {
		const query = { rid };

		const update = {
			$set: {
				name,
			},
		};
		return this.updateOne(query, update);
	}

	findOneByToken(token: string): Promise<ILivechatInquiryRecord | null> {
		const query: Filter<ILivechatInquiryRecord> = {
			'v.token': token,
			'status': LivechatInquiryStatus.QUEUED,
		};

		return this.findOne(query);
	}

	removeDefaultAgentById(inquiryId: string): Promise<UpdateResult | Document> {
		return this.updateOne(
			{
				_id: inquiryId,
			},
			{
				$unset: { defaultAgent: 1 },
			},
		);
	}

	async removeByVisitorToken(token: string): Promise<void> {
		const query = {
			'v.token': token,
		};

		await this.deleteMany(query);
	}

	async markInquiryActiveForPeriod(rid: ILivechatInquiryRecord['rid'], period: string): Promise<ILivechatInquiryRecord | null> {
		return this.findOneAndUpdate({ rid }, { $addToSet: { 'v.activity': period } });
	}

	updateNameByVisitorIds(visitorIds: string[], name: string): Promise<UpdateResult | Document> {
		const query = { 'v._id': { $in: visitorIds } };

		const update = {
			$set: { name },
		};

		return this.updateMany(query, update);
	}

	findByVisitorIds(visitorIds: string[], options?: FindOptions<ILivechatInquiryRecord>): FindCursor<ILivechatInquiryRecord> {
		return this.find({ 'v._id': { $in: visitorIds } }, options);
	}
}
