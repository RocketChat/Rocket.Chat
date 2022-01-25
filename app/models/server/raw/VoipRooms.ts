import { Cursor, FilterQuery, WithoutProjection, FindOneOptions, WriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipRoom } from '../../../../definition/IRoom';
import { Logger } from '../../../../server/lib/logger/Logger';
import { IRoomClosingInfo } from '../../../../definition/IRoomClosingInfo';

export class VoipRoomsRaw extends BaseRaw<IVoipRoom> {
	logger = new Logger('VoipRoomsRaw');

	findOneOpenByVisitorToken(visitorToken: string, options: WithoutProjection<FindOneOptions<IVoipRoom>> = {}): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'open': true,
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

	async findOneVoipRoomById(id: string, options: WithoutProjection<FindOneOptions<IVoipRoom>> = {}): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			t: 'v',
			_id: id,
		};
		if (options === undefined) {
			return this.findOne(query);
		}
		return this.findOne(query, options);
	}

	findOneOpenByRoomIdAndVisitorToken(
		roomId: string,
		visitorToken: string,
		options: WithoutProjection<FindOneOptions<IVoipRoom>> = {},
	): Promise<IVoipRoom | null> {
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'_id': roomId,
			'open': true,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
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

	findOneByVisitorToken(visitorToken: string, fields: any): Promise<IVoipRoom | null> {
		const options = {
			...(fields && { fields }),
		};
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	findOneByIdAndVisitorToken(_id: IVoipRoom['_id'], visitorToken: string, fields: any): Promise<IVoipRoom | null> {
		const options = {
			...(fields && { fields }),
		};
		const query: FilterQuery<IVoipRoom> = {
			't': 'v',
			_id,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	closeByRoomId(roomId: IVoipRoom['_id'], closeInfo: IRoomClosingInfo): Promise<any> {
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
