import { Meteor } from 'meteor/meteor';
import mem from 'mem';
import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { SearchLogger } from '../logger/logger';
import { canAccessRoomAsync } from '../../../authorization/server';
import { Users, Rooms } from '../../../models/server';
import type { IRawSearchResult, ISearchResult } from '../model/ISearchResult';
import { isTruthy } from '../../../../lib/isTruthy';

export class SearchResultValidationService {
	private getSubscription = mem((rid: IRoom['_id'], uid?: IUser['_id']) => {
		if (!rid) {
			return;
		}

		const room = Rooms.findOneById(rid) as IRoom | undefined;
		if (!room) {
			return;
		}

		if (!uid || !Promise.await(canAccessRoomAsync(room, { _id: uid }))) {
			return;
		}

		return room;
	});

	private getUser = mem((uid: IUser['_id']) => {
		if (!uid) {
			return;
		}

		return Users.findOneById(uid, { fields: { username: 1 } }) as IUser | undefined;
	});

	validateSearchResult(result: IRawSearchResult): ISearchResult {
		const uid = Meteor.userId() ?? undefined;

		const validatedResult: ISearchResult = {};

		// get subscription for message
		if (result.message) {
			validatedResult.message = {
				docs: result.message.docs
					.map((msg) => {
						const user = this.getUser(msg.u._id);
						const subscription = this.getSubscription(msg.rid, uid);

						if (subscription) {
							SearchLogger.debug(`user ${uid} can access ${msg.rid}`);
							return {
								...msg,
								user: msg.u._id,
								r: { name: subscription.name, t: subscription.t },
								username: user?.username,
								valid: true,
							};
						}

						SearchLogger.debug(`user ${uid} can NOT access ${msg.rid}`);
						return undefined;
					})
					.filter(isTruthy),
			};
		}

		if (result.room) {
			result.room.docs = result.room.docs
				.map((room) => {
					const subscription = this.getSubscription(room._id, uid);

					if (!subscription) {
						SearchLogger.debug(`user ${uid} can NOT access ${room._id}`);
						return undefined;
					}

					SearchLogger.debug(`user ${uid} can access ${room._id}`);

					return {
						...room,
						valid: true,
						t: subscription.t,
						name: subscription.name,
					};
				})
				.filter(isTruthy);
		}

		return validatedResult;
	}
}
