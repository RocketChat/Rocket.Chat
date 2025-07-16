import { type IVoipRoomClosingInfo, type IVoipRoom, type RocketChatRecordDeleted, UserStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { FindPaginated, IVoipRoomModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Collection, FindCursor, Db, Filter, FindOptions, UpdateResult, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class VoipRoomRaw extends BaseRaw<IVoipRoom> implements IVoipRoomModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IVoipRoom>>) {
		super(db, 'room', trash);
	}

	logger = new Logger('VoipRoomsRaw');

	async findOneOpenByVisitorToken(visitorToken: string, options: FindOptions<IVoipRoom> = {}): Promise<IVoipRoom | null> {
		const query: Filter<IVoipRoom> = {
			't': 'v',
			'open': true,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	findOpenByAgentId(agentId: string): FindCursor<IVoipRoom> {
		return this.find({
			't': 'v',
			'open': true,
			'servedBy._id': agentId,
		});
	}

	async findOneByAgentId(agentId: string): Promise<IVoipRoom | null> {
		return this.findOne({
			't': 'v',
			'open': true,
			'servedBy._id': agentId,
		});
	}

	async findOneVoipRoomById(id: string, options: FindOptions<IVoipRoom> = {}): Promise<IVoipRoom | null> {
		const query: Filter<IVoipRoom> = {
			t: 'v',
			_id: id,
		};
		return this.findOne(query, options);
	}

	async findOneOpenByRoomIdAndVisitorToken(
		roomId: string,
		visitorToken: string,
		options: FindOptions<IVoipRoom> = {},
	): Promise<IVoipRoom | null> {
		const query: Filter<IVoipRoom> = {
			't': 'v',
			'_id': roomId,
			'open': true,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	async findOneByVisitorToken(visitorToken: string, options: FindOptions<IVoipRoom> = {}): Promise<IVoipRoom | null> {
		const query: Filter<IVoipRoom> = {
			't': 'v',
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	async findOneByIdAndVisitorToken(
		_id: IVoipRoom['_id'],
		visitorToken: string,
		options: FindOptions<IVoipRoom> = {},
	): Promise<IVoipRoom | null> {
		const query: Filter<IVoipRoom> = {
			't': 'v',
			_id,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	closeByRoomId(roomId: IVoipRoom['_id'], closeInfo: IVoipRoomClosingInfo): Promise<Document | UpdateResult> {
		const { closer, closedBy, closedAt, callDuration, serviceTimeDuration, ...extraData } = closeInfo;

		return this.updateOne(
			{
				_id: roomId,
				t: 'v',
			},
			{
				$set: {
					closer,
					closedBy,
					closedAt,
					callDuration,
					'metrics.serviceTimeDuration': serviceTimeDuration,
					'v.status': UserStatus.OFFLINE,
					...extraData,
				},
				$unset: {
					open: 1,
				},
			},
		);
	}

	findRoomsWithCriteria({
		agents,
		open,
		createdAt,
		closedAt,
		tags,
		queue,
		visitorId,
		direction,
		roomName,
		options = {},
	}: {
		agents?: string[];
		open?: boolean;
		createdAt?: { start?: string; end?: string };
		closedAt?: { start?: string; end?: string };
		tags?: string[];
		queue?: string;
		visitorId?: string;
		direction?: IVoipRoom['direction'];
		roomName?: string;
		options?: {
			sort?: FindOptions<IVoipRoom>['sort'];
			count?: number;
			fields?: Record<string, unknown>;
			offset?: number;
		};
	}): FindPaginated<FindCursor<IVoipRoom>> {
		const query: Filter<IVoipRoom> = {
			t: 'v',
			...(visitorId && visitorId !== 'undefined' && { 'v._id': visitorId }),
			...(agents && { 'servedBy._id': { $in: agents } }),
		};

		if (open !== undefined) {
			query.open = { $exists: open };
		}
		if (createdAt && Object.keys(createdAt).length) {
			query.ts = {};
			if (createdAt.start) {
				query.ts.$gte = new Date(createdAt.start);
			}
			if (createdAt.end) {
				query.ts.$lte = new Date(createdAt.end);
			}
		}
		if (closedAt && Object.keys(closedAt).length) {
			query.closedAt = {};
			if (closedAt.start) {
				query.closedAt.$gte = new Date(closedAt.start);
			}
			if (closedAt.end) {
				query.closedAt.$lte = new Date(closedAt.end);
			}
		}
		if (tags) {
			query.tags = { $in: tags };
		}
		if (queue) {
			query.queue = queue;
		}
		if (direction) {
			query.direction = direction;
		}
		if (roomName) {
			query.name = new RegExp(escapeRegExp(roomName), 'i');
		}

		return this.findPaginated(query, {
			sort: options.sort || { name: 1 },
			skip: options.offset,
			limit: options.count,
		});
	}
}
