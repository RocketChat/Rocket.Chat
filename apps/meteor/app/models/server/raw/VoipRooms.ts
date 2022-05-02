import { FilterQuery, WithoutProjection, FindOneOptions, WriteOpResult, Cursor } from 'mongodb';
import type { IVoipRoom, IRoomClosingInfo } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import { Logger } from '../../../../server/lib/logger/Logger';

export class VoipRoomsRaw extends BaseRaw<IVoipRoom> {
	logger = new Logger('VoipRoomsRaw');

	async findOneOpenByVisitorToken(visitorToken: string, options: FindOneOptions<IVoipRoom> = {}): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'open': true,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	findOpenByAgentId(agentId: string): Cursor<IVoipRoom> {
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

	async findOneVoipRoomById(id: string, options: WithoutProjection<FindOneOptions<IVoipRoom>> = {}): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			t: 'v',
			_id: id,
		};
		return this.findOne(query, options);
	}

	async findOneOpenByRoomIdAndVisitorToken(
		roomId: string,
		visitorToken: string,
		options: FindOneOptions<IVoipRoom> = {},
	): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'_id': roomId,
			'open': true,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	async findOneByVisitorToken(visitorToken: string, options: FindOneOptions<IVoipRoom> = {}): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	async findOneByIdAndVisitorToken(
		_id: IVoipRoom['_id'],
		visitorToken: string,
		options: FindOneOptions<IVoipRoom> = {},
	): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			_id,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	closeByRoomId(roomId: IVoipRoom['_id'], closeInfo: IRoomClosingInfo): Promise<WriteOpResult> {
		const { closer, closedBy, closedAt, callDuration, serviceTimeDuration, ...extraData } = closeInfo;

		return this.update(
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
					'v.status': 'offline',
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
		options = {},
	}: {
		agents?: string[];
		open?: boolean;
		createdAt?: { start?: string; end?: string };
		closedAt?: { start?: string; end?: string };
		tags?: string[];
		queue?: string;
		visitorId?: string;
		options?: {
			sort?: Record<string, unknown>;
			count?: number;
			fields?: Record<string, unknown>;
			offset?: number;
		};
	}): Cursor<IVoipRoom> {
		const query: FilterQuery<IVoipRoom> = {
			t: 'v',
		};

		if (agents) {
			query.$or = [{ 'servedBy._id': { $in: agents } }, { 'servedBy.username': { $in: agents } }];
		}
		if (open !== undefined) {
			query.open = { $exists: open };
		}
		if (visitorId && visitorId !== 'undefined') {
			query['v._id'] = visitorId;
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

		return this.find(query, {
			sort: options.sort || { name: 1 },
			skip: options.offset,
			limit: options.count,
		});
	}
}
