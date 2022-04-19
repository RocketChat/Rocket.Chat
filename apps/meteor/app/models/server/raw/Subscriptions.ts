import { FindOneOptions, Cursor, UpdateQuery, FilterQuery, UpdateWriteOpResult, Collection, WithoutProjection } from 'mongodb';
import { compact } from 'lodash';
import type { ISubscription, IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';
import { UsersRaw } from './Users';

type T = ISubscription;
export class SubscriptionsRaw extends BaseRaw<T> {
	constructor(public readonly col: Collection<T>, private readonly models: { Users: UsersRaw }, trash?: Collection<T>) {
		super(col, trash);
	}

	async getBadgeCount(uid: string): Promise<number> {
		const [result] = await this.col
			.aggregate<{ total: number } | undefined>([
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

	findOneByRoomIdAndUserId(rid: string, uid: string, options: FindOneOptions<T> = {}): Promise<T | null> {
		const query = {
			rid,
			'u._id': uid,
		};

		return this.findOne(query, options);
	}

	findByUserIdAndRoomIds(userId: string, roomIds: Array<string>, options: FindOneOptions<T> = {}): Cursor<T> {
		const query = {
			'u._id': userId,
			'rid': {
				$in: roomIds,
			},
		};

		return this.find(query, options);
	}

	findByRoomIdAndNotUserId(roomId: string, userId: string, options: FindOneOptions<T> = {}): Cursor<T> {
		const query = {
			'rid': roomId,
			'u._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	findByLivechatRoomIdAndNotUserId(roomId: string, userId: string, options: FindOneOptions<T> = {}): Cursor<T> {
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

		const cursor = this.find(query, { projection: { _id: 0 } });

		return cursor.count();
	}

	async isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<T | null> {
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

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateWriteOpResult> {
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

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined): Promise<Cursor<IUser>>;

	findUsersInRoles(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: WithoutProjection<FindOneOptions<IUser>>,
	): Promise<Cursor<IUser>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P>>;

	async findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: IRoom['_id'] | undefined,
		options?: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P>> {
		const query = {
			roles: { $in: roles },
			...(rid && { rid }),
		};

		const subscriptions = await this.find(query).toArray();

		const users = compact(subscriptions.map((subscription) => subscription.u?._id).filter(Boolean));

		return !options
			? this.models.Users.find({ _id: { $in: users } })
			: this.models.Users.find({ _id: { $in: users } } as FilterQuery<IUser>, options);
	}

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateWriteOpResult> {
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
			fields: { _id: 1 },
		};

		const found = await this.findOne(query, options);
		return !!found;
	}
}
