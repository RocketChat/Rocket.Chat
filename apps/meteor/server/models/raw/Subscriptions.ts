import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IRole, IRoom, ISubscription, IUser, RocketChatRecordDeleted, RoomType, SpotlightUser } from '@rocket.chat/core-typings';
import type { ISubscriptionsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Filter, FindOptions, UpdateResult, DeleteResult, Document, AggregateOptions } from 'mongodb';
import { Rooms, Users } from '@rocket.chat/models';
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

	async removeByRoomId(roomId: string): Promise<DeleteResult> {
		const query = {
			rid: roomId,
		};

		const result = await this.deleteMany(query);

		if (Match.test(result, Number) && result > 0) {
			await Rooms.incUsersCountByIds([roomId], -result);
		}

		await Users.removeRoomByRoomId(roomId);

		return result;
	}

	async findConnectedUsersExcept(
		userId: string,
		searchTerm: string,
		exceptions: string[],
		searchFields: string[],
		limit: number,
		roomType?: ISubscription['t'],
		{ startsWith = false, endsWith = false }: { startsWith?: string | false; endsWith?: string | false } = {},
		options: AggregateOptions = {},
	): Promise<SpotlightUser[]> {
		const termRegex = new RegExp((startsWith ? '^' : '') + escapeRegExp(searchTerm) + (endsWith ? '$' : ''), 'i');
		const orStatement = searchFields.reduce(function (acc, el) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, [] as { [x: string]: RegExp }[]);

		return this.col
			.aggregate<SpotlightUser>(
				[
					// Match all subscriptions of the requester
					{
						$match: {
							'u._id': userId,
							...(roomType ? { t: roomType } : {}),
						},
					},
					// Group by room id and drop all other subcription data
					{
						$group: {
							_id: '$rid',
						},
					},
					// find all subscriptions to the same rooms by other users
					{
						$lookup: {
							from: 'rocketchat_subscription',
							as: 'subscription',
							let: {
								rid: '$_id',
							},
							pipeline: [{ $match: { '$expr': { $eq: ['$rid', '$$rid'] }, 'u._id': { $ne: userId } } }],
						},
					},
					// Unwind the subscription so we have a separate document for each
					{
						$unwind: {
							path: '$subscription',
						},
					},
					// Group the data by user id, keeping track of how many documents each user had
					{
						$group: {
							_id: '$subscription.u._id',
							score: {
								$sum: 1,
							},
						},
					},
					// Load the data for the subscription's user, ignoring those who don't match the search terms
					{
						$lookup: {
							from: 'users',
							as: 'user',
							let: { id: '$_id' },
							pipeline: [
								{
									$match: {
										$expr: { $eq: ['$_id', '$$id'] },
										active: true,
										username: {
											$exists: true,
											...(exceptions.length > 0 && { $nin: exceptions }),
										},
										...(searchTerm && orStatement.length > 0 && { $or: orStatement }),
									},
								},
							],
						},
					},
					// Discard documents that didn't load any user data in the previous step:
					{
						$unwind: {
							path: '$user',
						},
					},
					// Use group to organize the data at the same time that we pick what to project to the end result
					{
						$group: {
							_id: '$_id',
							score: {
								$sum: '$score',
							},
							name: { $first: '$user.name' },
							username: { $first: '$user.username' },
							nickname: { $first: '$user.nickname' },
							status: { $first: '$user.status' },
							statusText: { $first: '$user.statusText' },
							avatarETag: { $first: '$user.avatarETag' },
						},
					},
					// Sort by score
					{
						$sort: {
							score: -1,
						},
					},
					// Limit the number of results
					{
						$limit: limit,
					},
				],
				options,
			)
			.toArray();
	}

	incUnreadForRoomIdExcludingUserIds(roomId: IRoom['_id'], userIds: IUser['_id'][], inc: number): Promise<UpdateResult | Document> {
		if (inc == null) {
			inc = 1;
		}
		const query = {
			'rid': roomId,
			'u._id': {
				$nin: userIds,
			},
		};

		const update = {
			$set: {
				alert: true,
				open: true,
			},
			$inc: {
				unread: inc,
			},
		};

		return this.updateMany(query, update);
	}

	setAlertForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document> {
		const query = {
			'rid': roomId,
			'u._id': {
				$ne: userId,
			},
			'alert': { $ne: true },
		};

		const update = {
			$set: {
				alert: true,
			},
		};
		return this.updateMany(query, update);
	}

	setOpenForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document> {
		const query = {
			'rid': roomId,
			'u._id': {
				$ne: userId,
			},
			'open': { $ne: true },
		};

		const update = {
			$set: {
				open: true,
			},
		};
		return this.updateMany(query, update);
	}
}
