import type {
	ILivechatPriority,
	IOmnichannelRoom,
	IOmnichannelServiceLevelAgreements,
	RocketChatRecordDeleted,
	ReportResult,
	ILivechatContact,
} from '@rocket.chat/core-typings';
import { LivechatPriorityWeight, DEFAULT_SLA_CONFIG } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatRoomsModel } from '@rocket.chat/model-typings';
import type { Updater } from '@rocket.chat/models';
import { LivechatRoomsRaw } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { FindCursor, UpdateResult, Document, FindOptions, Db, Collection, Filter, AggregationCursor, UpdateOptions } from 'mongodb';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

declare module '@rocket.chat/model-typings' {
	interface ILivechatRoomsModel {
		associateRoomsWithDepartmentToUnit: (departments: string[], unit: string) => Promise<void>;
		removeUnitAssociationFromRooms: (unit: string) => Promise<void>;
		updateDepartmentAncestorsById: (rid: string, ancestors?: string[]) => Promise<UpdateResult>;
		unsetPredictedVisitorAbandonmentByRoomId(rid: string): Promise<UpdateResult>;
		findAbandonedOpenRooms(date: Date, extraQuery?: Filter<IOmnichannelRoom>): FindCursor<IOmnichannelRoom>;
		setPredictedVisitorAbandonmentByRoomId(roomId: string, date: Date): Promise<UpdateResult>;
		getPredictedVisitorAbandonmentByRoomIdUpdateQuery(date: Date, roomUpdater: Updater<IOmnichannelRoom>): Updater<IOmnichannelRoom>;
		unsetAllPredictedVisitorAbandonment(): Promise<void>;
		setOnHoldByRoomId(roomId: string): Promise<UpdateResult>;
		unsetOnHoldByRoomId(roomId: string): Promise<UpdateResult>;
		unsetOnHoldAndPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult>;
		setSlaForRoomById(
			roomId: string,
			sla: Pick<IOmnichannelServiceLevelAgreements, '_id' | 'dueTimeInMinutes'>,
		): Promise<UpdateResult | Document>;
		removeSlaFromRoomById(roomId: string): Promise<UpdateResult | Document>;
		bulkRemoveSlaFromRoomsById(slaId: string): Promise<UpdateResult | Document>;
		findOpenBySlaId(
			slaId: string,
			options: FindOptions<IOmnichannelRoom>,
			extraQuery?: Filter<IOmnichannelRoom>,
		): FindCursor<IOmnichannelRoom>;
		setPriorityByRoomId(roomId: string, priority: Pick<ILivechatPriority, '_id' | 'sortItem'>): Promise<UpdateResult>;
		unsetPriorityByRoomId(roomId: string): Promise<UpdateResult>;
		countPrioritizedRooms(): Promise<number>;
		countRoomsWithSla(): Promise<number>;
		countRoomsWithPdfTranscriptRequested(): Promise<number>;
		countRoomsWithTranscriptSent(): Promise<number>;
		getConversationsBySource(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): AggregationCursor<ReportResult>;
		getConversationsByStatus(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): AggregationCursor<ReportResult>;
		getConversationsByDepartment(
			start: Date,
			end: Date,
			sort: Record<string, 1 | -1>,
			extraQuery: Filter<IOmnichannelRoom>,
		): AggregationCursor<ReportResult>;
		getConversationsByTags(
			start: Date,
			end: Date,
			sort: Record<string, 1 | -1>,
			extraQuery: Filter<IOmnichannelRoom>,
		): AggregationCursor<ReportResult>;
		getConversationsByAgents(
			start: Date,
			end: Date,
			sort: Record<string, 1 | -1>,
			extraQuery: Filter<IOmnichannelRoom>,
		): AggregationCursor<ReportResult>;
		getConversationsWithoutTagsBetweenDate(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number>;
		getTotalConversationsWithoutAgentsBetweenDate(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number>;
		getTotalConversationsWithoutDepartmentBetweenDates(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number>;
		updateMergedContactIds(
			contactIdsThatWereMerged: ILivechatContact['_id'][],
			newContactId: ILivechatContact['_id'],
			options?: UpdateOptions,
		): Promise<UpdateResult | Document>;
	}
}

export class LivechatRoomsRawEE extends LivechatRoomsRaw implements ILivechatRoomsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOmnichannelRoom>>) {
		super(db, trash);
	}

	countPrioritizedRooms(): Promise<number> {
		return this.countDocuments({ priorityId: { $exists: true } });
	}

	countRoomsWithSla(): Promise<number> {
		return this.countDocuments({ slaId: { $exists: true } });
	}

	countRoomsWithPdfTranscriptRequested(): Promise<number> {
		return this.countDocuments({ pdfTranscriptRequested: true });
	}

	countRoomsWithTranscriptSent(): Promise<number> {
		return this.countDocuments({ pdfTranscriptFileId: { $exists: true } });
	}

	async unsetAllPredictedVisitorAbandonment(): Promise<void> {
		return this.updateMany(
			{
				'open': true,
				't': 'l',
				'omnichannel.predictedVisitorAbandonmentAt': { $exists: true },
			},
			{
				$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
			},
		).then();
	}

	setOnHoldByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $set: { onHold: true } });
	}

	unsetOnHoldByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne({ _id: roomId }, { $unset: { onHold: 1 } });
	}

	unsetOnHoldAndPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: {
					'omnichannel.predictedVisitorAbandonmentAt': 1,
					'onHold': 1,
				},
			},
		);
	}

	setSlaForRoomById(
		roomId: string,
		sla: Pick<IOmnichannelServiceLevelAgreements, '_id' | 'dueTimeInMinutes'>,
	): Promise<UpdateResult | Document> {
		const { _id: slaId, dueTimeInMinutes } = sla;

		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$set: {
					slaId,
					estimatedWaitingTimeQueue: dueTimeInMinutes,
				},
			},
		);
	}

	removeSlaFromRoomById(roomId: string): Promise<UpdateResult | Document> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: {
					slaId: 1,
				},
				$set: {
					estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
				},
			},
		);
	}

	bulkRemoveSlaFromRoomsById(slaId: string): Promise<UpdateResult | Document> {
		return this.updateMany(
			{
				open: true,
				t: 'l',
				slaId,
			},
			{
				$unset: { slaId: 1 },
				$set: {
					estimatedWaitingTimeQueue: DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
				},
			},
		);
	}

	findOpenBySlaId(
		slaId: string,
		options: FindOptions<IOmnichannelRoom>,
		extraQuery?: Filter<IOmnichannelRoom>,
	): FindCursor<IOmnichannelRoom> {
		const query = {
			t: 'l' as const,
			open: true,
			slaId,
			...extraQuery,
		};

		return this.find(query, options);
	}

	async setPriorityByRoomId(roomId: string, priority: Pick<ILivechatPriority, '_id' | 'sortItem'>): Promise<UpdateResult> {
		const { _id: priorityId, sortItem: priorityWeight } = priority;

		return this.updateOne({ _id: roomId }, { $set: { priorityId, priorityWeight } });
	}

	async unsetPriorityByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: roomId },
			{
				$unset: {
					priorityId: 1,
				},
				$set: {
					priorityWeight: LivechatPriorityWeight.NOT_SPECIFIED,
				},
			},
		);
	}

	getPredictedVisitorAbandonmentByRoomIdUpdateQuery(
		date: Date,
		roomUpdater: Updater<IOmnichannelRoom> = this.getUpdater(),
	): Updater<IOmnichannelRoom> {
		return roomUpdater.set('omnichannel.predictedVisitorAbandonmentAt', date);
	}

	setPredictedVisitorAbandonmentByRoomId(rid: string, willBeAbandonedAt: Date): Promise<UpdateResult> {
		const query = {
			_id: rid,
		};
		const update = {
			$set: {
				'omnichannel.predictedVisitorAbandonmentAt': willBeAbandonedAt,
			},
		};

		return this.updateOne(query, update);
	}

	findAbandonedOpenRooms(date: Date, extraQuery?: Filter<IOmnichannelRoom>): FindCursor<IOmnichannelRoom> {
		return this.find({
			'omnichannel.predictedVisitorAbandonmentAt': { $lte: date },
			'waitingResponse': { $exists: false },
			'closedAt': { $exists: false },
			'open': true,
			...extraQuery,
		});
	}

	async unsetPredictedVisitorAbandonmentByRoomId(roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: roomId,
			},
			{
				$unset: { 'omnichannel.predictedVisitorAbandonmentAt': 1 },
			},
		);
	}

	async associateRoomsWithDepartmentToUnit(departments: string[], unitId: string): Promise<void> {
		const query = {
			$and: [
				{
					departmentId: { $in: departments },
				},
				{
					$or: [
						{
							departmentAncestors: { $exists: false },
						},
						{
							$and: [
								{
									departmentAncestors: { $exists: true },
								},
								{
									departmentAncestors: { $ne: unitId },
								},
							],
						},
					],
				},
			],
		};
		const update = { $set: { departmentAncestors: [unitId] } };
		await this.updateMany(query, update);

		const queryToDisassociateOldRoomsConnectedToUnit = {
			departmentAncestors: unitId,
			departmentId: { $nin: departments },
		};
		const updateToDisassociateRooms = { $unset: { departmentAncestors: 1 } };
		await this.updateMany(queryToDisassociateOldRoomsConnectedToUnit, updateToDisassociateRooms);
	}

	async removeUnitAssociationFromRooms(unitId: string): Promise<void> {
		const query = {
			departmentAncestors: unitId,
		};
		const update = { $unset: { departmentAncestors: 1 } };
		await this.updateMany(query, update);
	}

	async updateDepartmentAncestorsById(rid: string, departmentAncestors?: string[]) {
		const query = {
			_id: rid,
		};
		const update = departmentAncestors ? { $set: { departmentAncestors } } : { $unset: { departmentAncestors: 1 } };
		return this.updateOne(query, update);
	}

	getConversationsBySource(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): AggregationCursor<ReportResult> {
		return this.col.aggregate(
			[
				{
					$match: {
						source: {
							$exists: true,
						},
						t: 'l',
						ts: {
							$gte: start,
							$lt: end,
						},
						...extraQuery,
					},
				},
				{
					$group: {
						_id: {
							type: '$source.type',
							alias: '$source.alias',
						},
						value: { $sum: 1 },
					},
				},
				{
					$sort: { value: -1 },
				},
				{
					$group: {
						_id: null,
						total: { $sum: '$value' },
						data: {
							$push: {
								label: {
									$ifNull: ['$_id.alias', '$_id.type'],
								},
								value: '$value',
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
					},
				},
			],
			{ hint: 'source_1_ts_1', readPreference: readSecondaryPreferred() },
		);
	}

	getConversationsByStatus(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): AggregationCursor<ReportResult> {
		return this.col.aggregate(
			[
				{
					$match: {
						t: 'l',
						ts: {
							$gte: start,
							$lt: end,
						},
						...extraQuery,
					},
				},
				{
					$group: {
						_id: null,
						total: { $sum: 1 },
						open: {
							$sum: {
								$cond: [
									{
										$and: [
											{ $eq: ['$open', true] },
											{
												$or: [{ $not: ['$onHold'] }, { $eq: ['$onHold', false] }],
											},
											{ $ifNull: ['$servedBy', false] },
										],
									},
									1,
									0,
								],
							},
						},
						closed: {
							$sum: {
								$cond: [
									{
										$ifNull: ['$metrics.chatDuration', false],
									},
									1,
									0,
								],
							},
						},
						queued: {
							$sum: {
								$cond: [
									{
										$and: [
											{ $eq: ['$open', true] },
											{
												$eq: [
													{
														$ifNull: ['$servedBy', null],
													},
													null,
												],
											},
										],
									},
									1,
									0,
								],
							},
						},
						onhold: {
							$sum: {
								$cond: [{ $eq: ['$onHold', true] }, 1, 0],
							},
						},
					},
				},
				{
					$project: {
						total: 1,
						data: [
							{ label: 'Open', value: '$open' },
							{ label: 'Closed', value: '$closed' },
							{ label: 'Queued', value: '$queued' },
							{ label: 'On_Hold', value: '$onhold' },
						],
					},
				},
				{
					$unwind: '$data',
				},
				{
					$sort: { 'data.value': -1 },
				},
				{
					$group: {
						_id: '$_id',
						total: { $first: '$total' },
						data: { $push: '$data' },
					},
				},
				{
					$project: {
						_id: 0,
					},
				},
			],
			{ readPreference: readSecondaryPreferred() },
		);
	}

	getConversationsByDepartment(
		start: Date,
		end: Date,
		sort: Record<string, 1 | -1>,
		extraQuery: Filter<IOmnichannelRoom>,
	): AggregationCursor<ReportResult> {
		return this.col.aggregate(
			[
				{
					$match: {
						t: 'l',
						departmentId: {
							$exists: true,
						},
						ts: {
							$lt: end,
							$gte: start,
						},
						...extraQuery,
					},
				},
				{
					$group: {
						_id: '$departmentId',
						total: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: 'rocketchat_livechat_department',
						localField: '_id',
						foreignField: '_id',
						as: 'department',
					},
				},
				{
					$group: {
						_id: {
							$arrayElemAt: ['$department.name', 0],
						},
						total: {
							$sum: '$total',
						},
					},
				},
				{
					$match: {
						_id: {
							$ne: null,
						},
					},
				},
				{
					$sort: sort || { total: 1 },
				},
				{
					$group: {
						_id: null,
						total: { $sum: '$total' },
						data: {
							$push: {
								label: '$_id',
								value: '$total',
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
					},
				},
			],
			{ hint: 'departmentId_1_ts_1', readPreference: readSecondaryPreferred() },
		);
	}

	getTotalConversationsWithoutDepartmentBetweenDates(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number> {
		return this.countDocuments({
			t: 'l',
			departmentId: {
				$exists: false,
			},
			ts: {
				$gte: start,
				$lt: end,
			},
			...extraQuery,
		});
	}

	getConversationsByTags(
		start: Date,
		end: Date,
		sort: Record<string, 1 | -1>,
		extraQuery: Filter<IOmnichannelRoom>,
	): AggregationCursor<ReportResult> {
		return this.col.aggregate(
			[
				{
					$match: {
						t: 'l',
						ts: {
							$lt: end,
							$gte: start,
						},
						tags: {
							$exists: true,
							$ne: [],
						},
						...extraQuery,
					},
				},
				{
					$group: {
						_id: '$tags',
						total: {
							$sum: 1,
						},
					},
				},
				{
					$unwind: '$_id',
				},
				{
					$group: {
						_id: '$_id',
						total: { $sum: '$total' },
					},
				},
				{
					$sort: sort || { total: 1 },
				},
				{
					$group: {
						_id: null,
						total: { $sum: '$total' },
						data: {
							$push: {
								label: '$_id',
								value: '$total',
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
					},
				},
			],
			{ hint: 'tags.0_1_ts_1', readPreference: readSecondaryPreferred() },
		);
	}

	getConversationsWithoutTagsBetweenDate(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number> {
		return this.countDocuments({
			t: 'l',
			ts: {
				$gte: start,
				$lt: end,
			},
			$or: [
				{
					tags: {
						$exists: false,
					},
				},
				{
					tags: {
						$eq: [],
					},
				},
			],
			...extraQuery,
		});
	}

	getConversationsByAgents(
		start: Date,
		end: Date,
		sort: Record<string, 1 | -1>,
		extraQuery: Filter<IOmnichannelRoom>,
	): AggregationCursor<ReportResult> {
		return this.col.aggregate(
			[
				{
					$match: {
						t: 'l',
						ts: {
							$gte: start,
							$lt: end,
						},
						servedBy: {
							$exists: true,
						},
						...extraQuery,
					},
				},
				{
					$group: {
						_id: '$servedBy._id',
						total: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: 'users',
						localField: '_id',
						foreignField: '_id',
						as: 'agent',
					},
				},
				{
					$set: {
						agent: { $first: '$agent' },
					},
				},
				{
					$addFields: {
						name: {
							$ifNull: ['$agent.name', '$_id'],
						},
					},
				},
				{
					$sort: sort || { name: 1 },
				},
				{
					$group: {
						_id: null,
						total: { $sum: '$total' },
						data: {
							$push: {
								label: '$name',
								value: '$total',
							},
						},
					},
				},
				{
					$project: {
						_id: 0,
					},
				},
			],
			{ hint: 'servedBy_1_ts_1', readPreference: readSecondaryPreferred() },
		);
	}

	getTotalConversationsWithoutAgentsBetweenDate(start: Date, end: Date, extraQuery: Filter<IOmnichannelRoom>): Promise<number> {
		return this.countDocuments({
			t: 'l',
			ts: {
				$gte: start,
				$lt: end,
			},
			servedBy: {
				$exists: false,
			},
			...extraQuery,
		});
	}

	updateMergedContactIds(
		contactIdsThatWereMerged: ILivechatContact['_id'][],
		newContactId: ILivechatContact['_id'],
		options?: UpdateOptions,
	): Promise<UpdateResult | Document> {
		return this.updateMany({ contactId: { $in: contactIdsThatWereMerged } }, { $set: { contactId: newContactId } }, options);
	}

	findClosedRoomsByContactAndSourcePaginated({
		contactId,
		source,
		options = {},
	}: {
		contactId: string;
		source?: string;
		options?: FindOptions;
	}): FindPaginated<FindCursor<IOmnichannelRoom>> {
		return this.findPaginated<IOmnichannelRoom>(
			{
				contactId,
				closedAt: { $exists: true },
				...(source && {
					$or: [{ 'source.type': new RegExp(escapeRegExp(source), 'i') }, { 'source.alias': new RegExp(escapeRegExp(source), 'i') }],
				}),
			},
			options,
		);
	}
}
