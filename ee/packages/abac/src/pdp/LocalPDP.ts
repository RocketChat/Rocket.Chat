import type { IAbacAttributeDefinition, IRoom, AtLeast, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import { OnlyCompliantCanBeAddedToRoomError } from '../errors';
import { buildCompliantConditions, buildNonCompliantConditions, buildRoomNonCompliantConditionsFromSubject } from '../helper';
import type { IPolicyDecisionPoint } from './types';

export class LocalPDP implements IPolicyDecisionPoint {
	async isAvailable(): Promise<boolean> {
		return true;
	}

	async getHealthStatus(): Promise<void> {
		// Local PDP is always available, nothing to check
	}

	async canAccessObject(
		room: AtLeast<IRoom, '_id' | 'abacAttributes'>,
		user: AtLeast<IUser, '_id'>,
	): Promise<{ granted: boolean; userToRemove?: IUser }> {
		const isUserCompliant = await Users.findOne(
			{
				_id: user._id,
				$and: buildCompliantConditions(room.abacAttributes ?? []),
			},
			{ projection: { _id: 1 } },
		);

		if (!isUserCompliant) {
			const fullUser = await Users.findOneById(user._id);
			if (!fullUser) {
				return { granted: false };
			}

			return { granted: false, userToRemove: fullUser };
		}

		return { granted: true };
	}

	async onRoomAttributesChanged(
		room: AtLeast<IRoom, '_id' | 't' | 'teamMain' | 'abacAttributes'>,
		newAttributes: IAbacAttributeDefinition[],
	): Promise<IUser[]> {
		const query = {
			__rooms: room._id,
			$or: buildNonCompliantConditions(newAttributes),
		};

		return Users.find(query, { projection: { __rooms: 0 } }).toArray();
	}

	async onSubjectAttributesChanged(user: IUser, _next: IAbacAttributeDefinition[]): Promise<IRoom[]> {
		const roomIds = user.__rooms;

		// No attributes: no rooms :(
		if (!_next.length) {
			return Rooms.find(
				{
					_id: { $in: roomIds },
					abacAttributes: { $exists: true, $ne: [] },
				},
				{ projection: { _id: 1 } },
			).toArray();
		}

		const query = {
			_id: { $in: roomIds },
			$or: buildRoomNonCompliantConditionsFromSubject(_next),
		};

		return Rooms.find(query, { projection: { _id: 1 } }).toArray();
	}

	async evaluateUserRooms(
		_entries: Array<{
			user: Pick<IUser, '_id' | 'emails' | 'username'>;
			rooms: AtLeast<IRoom, '_id' | 'abacAttributes'>[];
		}>,
	): Promise<Array<{ user: Pick<IUser, '_id' | 'emails' | 'username'>; room: IRoom }>> {
		throw new Error('evaluateUserRooms is not implemented for LocalPDP');
	}

	async checkUsernamesMatchAttributes(usernames: string[], attributes: IAbacAttributeDefinition[], _object: IRoom): Promise<void> {
		const nonCompliantUsersFromList = await Users.find(
			{
				username: { $in: usernames },
				$or: buildNonCompliantConditions(attributes),
			},
			{ projection: { username: 1 } },
		)
			.map((u) => u.username as string)
			.toArray();

		const nonCompliantSet = new Set<string>(nonCompliantUsersFromList);

		if (nonCompliantSet.size) {
			throw new OnlyCompliantCanBeAddedToRoomError();
		}
	}
}
