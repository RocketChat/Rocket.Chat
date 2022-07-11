import type { IRole, IRoom, ISubscription, IUser, RocketChatRecordDeleted, RoomType } from '@rocket.chat/core-typings';
import type { ISubscriptionsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Filter, FindOptions, UpdateResult } from 'mongodb';
import { Users } from '@rocket.chat/models';
import { compact } from 'lodash';

import { BaseRaw } from './BaseRaw';

export class SubscriptionsRaw extends BaseRaw<ISubscription> implements ISubscriptionsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ISubscription>>) {
		super(db, 'subscription', trash);
	}

	async getBadgeCount(uid: string): Promise<number> {
		const [result] = await this.col
			.aggregate<{ total: number }>([
				{ $match: { 'u._id': uid, 'archived': { $ne: true } } },
				{
					$group: {
						_id: 'total',
						total: { $sum: '$unread' },
					},
				},
			])
			.toArray();

		return result?.total || 0;
	}

	findOneByRoomIdAndUserId(rid: string, uid: string, options: FindOptions<ISubscription> = {}): Promise<ISubscription | null> {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findByUserIdAndRoomIds(userId: string, roomIds: Array<string>, options: FindOptions<ISubscription> = {}): FindCursor<ISubscription> {
		const query = {
			'u._id': userId,
			'rid': {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	findByRoomId(roomId: string, options: FindOptions<ISubscription> = {}): FindCursor<ISubscription> {
		const query = {
			rid: roomId,
		};

		return this.find(query, options);
	}

	findByRoomIdAndNotUserId(roomId: string, userId: string, options: FindOptions<ISubscription> = {}): FindCursor<ISubscription> {
		const query = {
			'rid': roomId,
			'u._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	findByLivechatRoomIdAndNotUserId(roomId: string, userId: string, options: FindOptions<ISubscription> = {}): FindCursor<ISubscription> {
		const query = {
			'rid': roomId,
			'servedBy._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	countByRoomIdAndUserId(rid: string, uid: string | undefined): Promise<number> {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.col.countDocuments(query);
	}

	async isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<ISubscription | null> {
		if (rid == null) {
			return null;
		}

		const query = {
			'u._id': uid,
			rid,
			'roles': roleId,
		};

		return this.findOne(query, { projection: { roles: 1 } });
	}

	setAsReadByRoomIdAndUserId(
		rid: string,
		uid: string,
		alert = false,
		options: FindOptions<ISubscription> = {},
	): ReturnType<BaseRaw<ISubscription>['update']> {
		const query: Filter<ISubscription> = {
			rid,
			'u._id': uid,
		};

		const update = {
			$set: {
				open: true,
				alert,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				ls: new Date(),
			},
		};

		return this.updateOne(query, update, options);
	}

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateResult> {
		const query = {
			'u._id': uid,
			rid,
		};

		const update = {
			$pullAll: {
				roles,
			},
		};

		return this.updateOne(query, update);
	}

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined): Promise<FindCursor<IUser>>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>>;

	async findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: IRoom['_id'] | undefined,
		options?: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>> {
		const query = {
			roles: { $in: roles },
			...(rid && { rid }),
		};

		const subscriptions = await this.find(query, { projection: { 'u._id': 1 } }).toArray();

		const users = compact(subscriptions.map((subscription) => subscription.u?._id).filter(Boolean));

		// TODO remove dependency to other models - this logic should be inside a function/service
		return Users.find<P>({ _id: { $in: users } }, options || {});
	}

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateResult> {
		if (!Array.isArray(roles)) {
			roles = [roles];
			process.env.NODE_ENV === 'development' && console.warn('[WARN] Subscriptions.addRolesByUserId: roles should be an array');
		}

		const query = {
			'u._id': uid,
			rid,
		};

		const update = {
			$addToSet: {
				roles: { $each: roles },
			},
		};

		return this.updateOne(query, update);
	}

	async isUserInRoleScope(uid: IUser['_id'], rid?: IRoom['_id']): Promise<boolean> {
		const query = {
			'u._id': uid,
			rid,
		};

		if (!rid) {
			return false;
		}
		const options = {
			projection: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}

	async updateAllRoomTypesByRoomId(roomId: IRoom['_id'], roomType: RoomType): Promise<void> {
		await this.updateMany({ rid: roomId }, { $set: { t: roomType } });
	}

	async updateAllRoomNamesByRoomId(roomId: IRoom['_id'], name: string, fname: string): Promise<void> {
		await this.updateMany({ rid: roomId }, { $set: { name, fname } });
	}

	findByRolesAndRoomId({ roles, rid }: { roles: string; rid?: string }, options?: FindOptions<ISubscription>): FindCursor<ISubscription> {
		return this.find(
			{
				roles,
				...(rid && { rid }),
			},
			options || {},
		);
	}

	findByUserIdAndTypes(userId: string, types: ISubscription['t'][], options?: FindOptions<ISubscription>): FindCursor<ISubscription> {
		const query = {
			'u._id': userId,
			't': {
				$in: types,
			},
		};

		return this.find(query, options || {});
	}
}
