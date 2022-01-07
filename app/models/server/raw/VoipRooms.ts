import { Cursor, FilterQuery, WithoutProjection, FindOneOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IVoipRoom } from '../../../../definition/IRoom';
import { Logger } from '../../../../server/lib/logger/Logger';

type T = IVoipRoom;
export class VoipRoomsRaw extends BaseRaw<T> {
	logger = new Logger('VoipRoomsRaw');

	findOneOpenByVisitorToken(visitorToken: string, options?: undefined | WithoutProjection<FindOneOptions<T>>): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			open: true,
			'v.token': visitorToken,
		};
		if (options === undefined) {
			return this.findOne(query);
		}
		return this.findOne(query, options);
	}

	findOpenByVisitorToken(visitorToken: string, options?: undefined | WithoutProjection<FindOneOptions<T>>): Cursor<T> {
		const query: FilterQuery <T> = {
			t: 'v',
			open: true,
			'v.token': visitorToken,
		};
		if (options === undefined) {
			return this.find(query);
		}
		return this.find(query, options);
	}

	/**
	 * (Amol) Delete this comment and code (if needed)
	 * after the review.
	 *
	 * We have findOneByIdOrName. Do we still need findOneVoipRoomById?
	 *
	*/
	async findOneVoipRoomById(id: string, options?: undefined | WithoutProjection<FindOneOptions<T>>): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			_id: id,
		};
		if (options === undefined) {
			return this.findOne(query);
		}
		return this.findOne(query, options);
	}

	findOneByIdOrName(_idOrName: string, options?: undefined | WithoutProjection<FindOneOptions<T>>): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};
		if (options === undefined) {
			return this.findOne(query);
		}
		return this.findOne(query, options);
	}

	findOneOpenByRoomIdAndVisitorToken(roomId: string, visitorToken: string, options?: undefined | WithoutProjection<FindOneOptions<T>>): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			_id: roomId,
			open: true,
			'v.token': visitorToken,
		};
		if (options === undefined) {
			return this.findOne(query);
		}
		return this.findOne(query, options);
	}

	setFnameById(_id: string, fname: string): Promise<any> {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};
		return this.update(query, update);
	}

	updateVisitorStatus(token: string, status: string): Promise<any> {
		const query: FilterQuery <T> = {
			'v.token': token,
			open: true,
			t: 'v',
		};

		const update = {
			$set: {
				'v.status': status,
			},
		};
		return this.update(query, update);
	}

	findOneByVisitorToken(visitorToken: string, fields: any): Promise<T|null> {
		let options = {};

		if (fields) {
			options = {
				fields,
			};
		}

		const query: FilterQuery <T> = {
			t: 'v',
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	findOneByIdAndVisitorToken(_id: string, visitorToken: string, fields: any): Promise<T|null> {
		let options = {};

		if (fields) {
			options = {
				fields,
			};
		}

		const query: FilterQuery <T> = {
			t: 'v',
			_id,
			'v.token': visitorToken,
		};
		return this.findOne(query, options);
	}

	closeByRoomId(roomId: string, closeInfo: any): Promise<any> {
		const { closer, closedBy, closedAt, callDuration, serviceTimeDuration, ...extraData } = closeInfo;

		return this.update({
			_id: roomId,
			t: 'v',
		}, {
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
		});
	}
}
