import { FilterQuery, WithoutProjection, FindOneOptions, WriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipRoom, IRoomClosingInfo } from '../../../../definition/IRoom';
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
					'metrics.callDuration': callDuration,
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
}
