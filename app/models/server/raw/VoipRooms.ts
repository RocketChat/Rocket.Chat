import { Cursor, FilterQuery } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IOmnichannelRoom } from '../../../../definition/IRoom';

type T = IOmnichannelRoom;
export class VoipRoomsRaw extends BaseRaw<T> {
	findOneOpenByVisitorToken(visitorToken: string, options: any): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			open: true,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	findOpenByVisitorToken(visitorToken: string, options: any): Cursor<T> {
		const query: FilterQuery <T> = {
			t: 'v',
			open: true,
			'v.token': visitorToken,
		};
		return this.find(query, options);
	}

	findOneByIdOrName(_idOrName: string, options: any): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}

	findOneOpenByRoomIdAndVisitorToken(roomId: string, visitorToken: string, options: any): Promise<T|null> {
		const query: FilterQuery <T> = {
			t: 'v',
			_id: roomId,
			open: true,
			'v.token': visitorToken,
		};

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
