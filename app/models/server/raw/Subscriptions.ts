import { FindOneOptions, Cursor, UpdateQuery, FilterQuery } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ISubscription } from '../../../../definition/ISubscription';

type T = ISubscription;
export class SubscriptionsRaw extends BaseRaw<T> {
	findOneByRoomIdAndUserId(rid: string, uid: string, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findByRoomIdAndNotUserId(roomId: string, userId: string, options: FindOneOptions<T> = {}): Cursor<T> {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	countByRoomIdAndUserId(rid: string, uid: string): Promise<number> {
		const query = {
			rid,
			'u._id': uid,
		};

		const cursor = this.find(query, { projection: { _id: 0 } });

		return cursor.count();
	}

	async isUserInRole(uid: string, roleName: string, rid: string): Promise<T | undefined> {
		if (rid == null) {
			return;
		}

		const query = {
			'u._id': uid,
			rid,
			roles: roleName,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	setAsReadByRoomIdAndUserId(rid: string, uid: string, alert = false, options: FindOneOptions<T> = {}): ReturnType<BaseRaw<T>['update']> {
		const query: FilterQuery<T> = {
			rid,
			'u._id': uid,
		};

		const update: UpdateQuery<T> = {
			$set: {
				open: true,
				alert,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				ls: new Date(),
			},
		};

		return this.update(query, update, options);
	}
}
