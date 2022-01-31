import { Cursor, FilterQuery, WithoutProjection, FindOneOptions, WriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipRoom } from '../../../../definition/IRoom';
import { Logger } from '../../../../server/lib/logger/Logger';
import { IRoomClosingInfo } from '../../../../definition/IRoomClosingInfo';

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

	async findOneByVisitorToken(visitorToken: string, fields?: Record<string, number>): Promise<IVoipRoom | null> {
		const options = {
			...(fields && { projection: fields }),
		};
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	async findOneByIdAndVisitorToken(
		_id: IVoipRoom['_id'],
		visitorToken: string,
		fields?: Record<string, number>,
	): Promise<IVoipRoom | null> {
		const options = {
			...(fields && { projection: fields }),
		};
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			_id,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	findOpenByVisitorToken(visitorToken: string, options: WithoutProjection<FindOneOptions<IVoipRoom>> = {}): Cursor<IVoipRoom> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'open': true,
			'v.token': visitorToken,
		};
		return this.find(query, options);
	}

	setFnameById(_id: IVoipRoom['_id'], fname: string): Promise<WriteOpResult> {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};
		return this.update(query, update);
	}

	updateVisitorStatus(token: string, status: string): Promise<WriteOpResult> {
		const query: FilterQuery<IVoipRoom> = {
			'v.token': token,
			'open': true,
			't': 'v',
		};

		const update = {
			$set: {
				'v.status': status,
			},
		};
		return this.update(query, update);
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
