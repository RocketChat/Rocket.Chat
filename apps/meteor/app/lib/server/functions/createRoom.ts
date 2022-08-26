import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';
import type { ICreatedRoom, IUser, IRoom, RoomType } from '@rocket.chat/core-typings';

import { Apps } from '../../../apps/server';
import { addUserRoles } from '../../../../server/lib/roles/addUserRoles';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms, Subscriptions, Users } from '../../../models/server';
import { getValidRoomName } from '../../../utils/server';
import { createDirectRoom } from './createDirectRoom';
import { Team } from '../../../../server/sdk';
import type { ICreateRoomParams, ISubscriptionExtraData } from '../../../../server/sdk/types/IRoomService';

const isValidName = (name: unknown): name is string => {
	return typeof name === 'string' && s.trim(name).length > 0;
};

export const createRoom = function <T extends RoomType>(
	type: T,
	name: T extends 'd' ? undefined : string,
	ownerUsername: string,
	members: T extends 'd' ? IUser[] : string[] = [],
	readOnly?: boolean,
	roomExtraData?: Partial<IRoom>,
	options?: ICreateRoomParams['options'],
): ICreatedRoom {
	const { teamId, ...extraData } = roomExtraData || ({} as IRoom);
	callbacks.run('beforeCreateRoom', { type, name, owner: ownerUsername, members, readOnly, extraData, options });

	if (type === 'd') {
		return createDirectRoom(members as IUser[], extraData, { ...options, creator: options?.creator || ownerUsername });
	}

	if (!isValidName(name)) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', {
			function: 'RocketChat.createRoom',
		});
	}

	const owner = Users.findOneByUsernameIgnoringCase(ownerUsername, { fields: { username: 1 } });

	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!_.contains(members, owner)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();

	const roomProps: Omit<IRoom, '_id' | '_updatedAt' | 'uids' | 'autoTranslateLanguage'> = {
		fname: name,
		...extraData,
		name: getValidRoomName(name.trim(), undefined, {
			...(options?.nameValidationRegex && { nameValidationRegex: options.nameValidationRegex }),
		}),
		t: type,
		msgs: 0,
		usersCount: 0,
		u: {
			_id: owner._id,
			username: owner.username,
		},
		ts: now,
		ro: readOnly === true,
	};

	if (teamId) {
		const team = Promise.await(Team.getOneById(teamId, { projection: { _id: 1 } }));
		if (team) {
			roomProps.teamId = team._id;
		}
	}

	const tmp = {
		...roomProps,
		_USERNAMES: members,
	};

	const prevent = Promise.await(
		Apps.triggerEvent('IPreRoomCreatePrevent', tmp).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}),
	);

	if (prevent) {
		throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	const eventResult = Promise.await(
		Apps.triggerEvent('IPreRoomCreateModify', Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', tmp))),
	);

	if (eventResult && typeof eventResult === 'object' && delete eventResult._USERNAMES) {
		Object.assign(roomProps, eventResult);
	}

	if (type === 'c') {
		callbacks.run('beforeCreateChannel', owner, roomProps);
	}
	const room = Rooms.createWithFullRoomData(roomProps);
	const shouldBeHandledByFederation = room.federated === true || ownerUsername.includes(':');
	if (shouldBeHandledByFederation) {
		const extra: Partial<ISubscriptionExtraData> = options?.subscriptionExtra || {};
		extra.open = true;
		extra.ls = now;

		if (room.prid) {
			extra.prid = room.prid;
		}

		Subscriptions.createWithRoomAndUser(room, owner, extra);
	} else {
		for (const username of [...new Set(members as string[])]) {
			const member = Users.findOneByUsername(username, {
				fields: { 'username': 1, 'settings.preferences': 1, 'federated': 1 },
			});
			if (!member) {
				continue;
			}

			try {
				callbacks.run('federation.beforeAddUserAToRoom', { user: member, inviter: owner }, room);
			} catch (error) {
				continue;
			}

			const extra: Partial<ISubscriptionExtraData> = options?.subscriptionExtra || {};

			extra.open = true;

			if (room.prid) {
				extra.prid = room.prid;
			}

			if (username === owner.username) {
				extra.ls = now;
			}

			Subscriptions.createWithRoomAndUser(room, member, extra);
		}
	}

	addUserRoles(owner._id, ['owner'], room._id);

	if (type === 'c') {
		if (room.teamId) {
			const team = Promise.await(Team.getOneById(room.teamId));
			team && Messages.createUserAddRoomToTeamWithRoomIdAndUser(team.roomId, room.name, owner);
		}
		callbacks.run('afterCreateChannel', owner, room);
	} else if (type === 'p') {
		callbacks.runAsync('afterCreatePrivateGroup', owner, room);
	}
	callbacks.runAsync('afterCreateRoom', owner, room);
	if (shouldBeHandledByFederation) {
		callbacks.run('federation.afterCreateFederatedRoom', room, { owner, originalMemberList: members as string[] });
	}

	Apps.triggerEvent('IPostRoomCreate', room);

	return {
		rid: room._id, // backwards compatible
		...room,
	};
};
