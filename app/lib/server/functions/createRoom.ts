import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { Apps } from '../../../apps/server';
import { addUserRoles } from '../../../authorization/server';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms, Subscriptions, Users } from '../../../models';
import { getValidRoomName } from '../../../utils';
import { createDirectRoom } from './createDirectRoom';
import { Team } from '../../../../server/sdk';
import { IUser } from '../../../../definition/IUser';
import { ICreateRoomParams } from '../../../../server/sdk/types/IRoomService';
import { IRoom } from '../../../../definition/IRoom';

export const createRoom = function (
	type: string,
	name: string,
	owner: IUser,
	members: IUser[],
	readOnly: boolean,
	{ teamId, ...extraData }: IRoom,
	options: ICreateRoomParams['options'],
): unknown {
	callbacks.run('beforeCreateRoom', { type, name, owner, members, readOnly, extraData, options });

	if (type === 'd') {
		return createDirectRoom(members, extraData, options);
	}

	name = s.trim(name);
	if (owner.username !== undefined) owner.username = s.trim(owner.username);
	members = [].concat(members as []);

	if (!name) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', {
			function: 'RocketChat.createRoom',
		});
	}

	owner = Users.findOneByUsernameIgnoringCase(owner, { fields: { username: 1 } });

	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.createRoom',
		});
	}

	if (!_.contains(members, owner)) {
		members.push(owner);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();

	// const validRoomNameOptions = {};
	let validRoomNameOptions: ICreateRoomParams['options'];

	if (validRoomNameOptions && options?.nameValidationRegex) {
		validRoomNameOptions.nameValidationRegex = options.nameValidationRegex;
	}

	let room: IRoom = {
		// fname: name,
		...extraData,
		name: getValidRoomName(name, undefined, validRoomNameOptions),
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
			room.teamId = team._id;
		}
	}

	function getUsername(item: IUser): string | undefined {
		if (item.username) return item.username;
	}

	// room._USERNAMES = members;
	room.usernames = members.map(getUsername) as string[];

	const prevent = Promise.await(
		Apps.triggerEvent('IPreRoomCreatePrevent', room).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}),
	);

	if (prevent) {
		throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	let result;
	result = Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', room));
	result = Promise.await(Apps.triggerEvent('IPreRoomCreateModify', result));

	if (typeof result === 'object') {
		Object.assign(room, result);
	}

	// delete room._USERNAMES;
	delete room.usernames;

	if (type === 'c') {
		callbacks.run('beforeCreateChannel', owner, room);
	}
	room = Rooms.createWithFullRoomData(room);

	for (const username of members) {
		const member = Users.findOneByUsername(username, {
			fields: { 'username': 1, 'settings.preferences': 1 },
		});
		if (!member) {
			continue;
		}

		const extra = options?.subscriptionExtra;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		extra!.open = true;

		if (room.prid) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			extra!.prid = room.prid;
		}

		if (username.username === owner.username) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			extra!.ls = now;
		}

		Subscriptions.createWithRoomAndUser(room, member, extra);
	}

	addUserRoles(owner._id, ['owner'], room._id);

	if (type === 'c') {
		if (room.teamId) {
			const team = Promise.await(Team.getOneById(room.teamId));
			Messages.createUserAddRoomToTeamWithRoomIdAndUser(team.roomId, room.name, owner);
		}
		Meteor.defer(() => {
			callbacks.run('afterCreateChannel', owner, room);
		});
	} else if (type === 'p') {
		Meteor.defer(() => {
			callbacks.run('afterCreatePrivateGroup', owner, room);
		});
	}
	Meteor.defer(() => {
		callbacks.run('afterCreateRoom', owner, room);
	});

	Apps.triggerEvent('IPostRoomCreate', room);

	return {
		rid: room._id, // backwards compatible
		...room,
	};
};
