import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import { isTruthy } from '@rocket.chat/tools';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../authorization';
import { SearchLogger } from '../logger/logger';
import type { IRawSearchResult, ISearchResult } from '../model/ISearchResult';

export class SearchResultValidationService {
	// `mem` keys on the first argument alone, so both `uid` and `maxAge` are mandatory here:
	// this memoizes an access-control decision, and a key that drops `uid` hands one user's
	// verdict to the next one asking about the same room.
	private getSubscription = mem(
		async (rid: IRoom['_id'], uid?: IUser['_id']) => {
			if (!rid) {
				return;
			}

			const room = await Rooms.findOneById(rid);
			if (!room) {
				return;
			}

			if (!uid || !(await canAccessRoomAsync(room, { _id: uid }))) {
				return;
			}

			return room;
		},
		{ maxAge: 5000, cacheKey: JSON.stringify },
	);

	private getUser = mem(async (uid: IUser['_id']) => (uid ? Users.findOneById(uid, { projection: { username: 1 } }) : undefined), {
		maxAge: 5000,
	});

	async validateSearchResult(result: IRawSearchResult): Promise<ISearchResult> {
		const uid = Meteor.userId() ?? undefined;

		const validatedResult: ISearchResult = {};

		// get subscription for message
		if (result.message) {
			validatedResult.message = {
				docs: (
					await Promise.all(
						result.message.docs.map(async (msg) => {
							const user = await this.getUser(msg.u._id);
							const subscription = await this.getSubscription(msg.rid, uid);

							if (subscription) {
								SearchLogger.debug({
									msg: 'User can access message',
									userId: uid,
									roomId: msg.rid,
								});
								return {
									...msg,
									user: msg.u._id,
									r: { name: subscription.name, t: subscription.t },
									username: user?.username,
									valid: true,
								};
							}

							SearchLogger.debug({
								msg: 'User cannot access message',
								userId: uid,
								roomId: msg.rid,
							});
							return undefined;
						}),
					)
				).filter(isTruthy),
			};
		}

		if (result.room) {
			result.room.docs = (
				await Promise.all(
					result.room.docs.map(async (room) => {
						const subscription = await this.getSubscription(room._id, uid);

						if (!subscription) {
							SearchLogger.debug({
								msg: 'User cannot access room',
								userId: uid,
								roomId: room._id,
							});
							return undefined;
						}

						SearchLogger.debug({
							msg: 'User can access room',
							userId: uid,
							roomId: room._id,
						});

						return {
							...room,
							valid: true,
							t: subscription.t,
							name: subscription.name,
						};
					}),
				)
			).filter(isTruthy);
		}

		return validatedResult;
	}
}
