import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { Apps } from '../../../apps/server';
import { addUserRoles } from '../../../authorization';
import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms, Subscriptions, Users } from '../../../models';
import { getValidRoomName } from '../../../utils';
import { createDirectRoom } from './createDirectRoom';
import { Team } from '../../../../server/sdk';

export const createRoom = function (type, name, owner, members = [], readOnly, { teamId, ...extraData } = {}, options = {}) {
	callbacks.run('beforeCreateRoom', { type, name, owner, members, readOnly, extraData, options });

	if (type === 'd') {
		return createDirectRoom(members, extraData, options);
	}

	name = s.trim(name);
	owner = s.trim(owner);
	members = [].concat(members);

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

	if (!_.contains(members, owner.username)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();

	const validRoomNameOptions = {};

	if (options.nameValidationRegex) {
		validRoomNameOptions.nameValidationRegex = options.nameValidationRegex;
	}

	let room = {
		fname: name,
		...extraData,
		name: getValidRoomName(name, null, validRoomNameOptions),
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

	room._USERNAMES = members;

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

	delete room._USERNAMES;

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

		const extra = options.subscriptionExtra || {};

		extra.open = true;

		if (room.prid) {
			extra.prid = room.prid;
		}

		if (username === owner.username) {
			extra.ls = now;
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
