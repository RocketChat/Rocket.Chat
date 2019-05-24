import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { Users, Rooms, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';
import { addUserRoles } from '../../../authorization';
import { getValidRoomName } from '../../../utils';
import { setRoomAvatar } from './setRoomAvatar';
import { Apps } from '../../../apps/server';

function createDirectRoom(source, target, extraData, options) {
	const rid = [source._id, target._id].sort().join('');

	Rooms.upsert({ _id: rid }, {
		$setOnInsert: Object.assign({
			t: 'd',
			usernames: [source.username, target.username],
			msgs: 0,
			ts: new Date(),
		}, extraData),
	});

	Subscriptions.upsert({ rid, 'u._id': target._id }, {
		$setOnInsert: Object.assign({
			name: source.username,
			t: 'd',
			open: true,
			alert: true,
			unread: 0,
			u: {
				_id: target._id,
				username: target.username,
			},
		}, options.subscriptionExtra),
	});

	Subscriptions.upsert({ rid, 'u._id': source._id }, {
		$setOnInsert: Object.assign({
			name: target.username,
			t: 'd',
			open: true,
			alert: true,
			unread: 0,
			u: {
				_id: source._id,
				username: source.username,
			},
		}, options.subscriptionExtra),
	});

	return {
		_id: rid,
		t: 'd',
	};
}

export const createRoom = function(type, name, owner, members, readOnly, extraData = {}, options = {}, avatar = null) {
	if (type === 'd') {
		return createDirectRoom(members[0], members[1], extraData, options);
	}

	name = s.trim(name);
	owner = s.trim(owner);
	members = [].concat(members);

	if (!name) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'RocketChat.createRoom' });
	}

	owner = Users.findOneByUsernameIgnoringCase(owner, { fields: { username: 1 } });
	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'RocketChat.createRoom' });
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

	let room = Object.assign({
		name: getValidRoomName(name, null, validRoomNameOptions),
		fname: name,
		t: type,
		msgs: 0,
		usersCount: 0,
		u: {
			_id: owner._id,
			username: owner.username,
		},
	}, extraData, {
		ts: now,
		ro: readOnly === true,
		sysMes: readOnly !== true,
	});

	if (type === 'd') {
		room.usernames = members;
	}

	if (Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreatePrevent', room));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-creation', 'A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateExtend', room));
		result = Promise.await(Apps.getBridges().getListenerBridge().roomEvent('IPreRoomCreateModify', result));

		if (typeof result === 'object') {
			room = Object.assign(room, result);
		}
	}

	if (type === 'c') {
		callbacks.run('beforeCreateChannel', owner, room);
	}

	room = Rooms.createWithFullRoomData(room);

	for (const username of members) {
		const member = Users.findOneByUsername(username, { fields: { username: 1, 'settings.preferences': 1 } });
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

	if (avatar) {
		const { blob, contentType, service } = avatar;
		setRoomAvatar(room, blob, contentType, service);
	}

	if (type === 'c') {
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

	if (Apps && Apps.isLoaded()) {
		// This returns a promise, but it won't mutate anything about the message
		// so, we don't really care if it is successful or fails
		Apps.getBridges().getListenerBridge().roomEvent('IPostRoomCreate', room);
	}

	return {
		rid: room._id, // backwards compatible
		...room,
	};
};
