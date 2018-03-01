/* globals RocketChat */
import _ from 'underscore';
import s from 'underscore.string';

RocketChat.createRoom = function(type, name, owner, members, readOnly, extraData={}) {
	name = s.trim(name);
	owner = s.trim(owner);
	members = [].concat(members);

	if (!name) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'RocketChat.createRoom' });
	}

	owner = RocketChat.models.Users.findOneByUsername(owner, { fields: { username: 1 }});
	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'RocketChat.createRoom' });
	}

	const slugifiedRoomName = RocketChat.getValidRoomName(name);

	const now = new Date();
	if (!_.contains(members, owner.username)) {
		members.push(owner.username);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	if (type === 'c') {
		RocketChat.callbacks.run('beforeCreateChannel', owner, {
			t: 'c',
			name: slugifiedRoomName,
			fname: name,
			ts: now,
			ro: readOnly === true,
			sysMes: readOnly !== true,
			usernames: members,
			u: {
				_id: owner._id,
				username: owner.username
			}
		});
	}

	extraData = Object.assign({}, extraData, {
		ts: now,
		ro: readOnly === true,
		sysMes: readOnly !== true
	});

	const room = RocketChat.models.Rooms.createWithTypeNameUserAndUsernames(type, slugifiedRoomName, name, owner, members, extraData);

	for (const username of members) {
		const member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }});
		if (!member) {
			continue;
		}

		// make all room members muted by default, unless they have the post-readonly permission
		if (readOnly === true && !RocketChat.authz.hasPermission(member._id, 'post-readonly')) {
			RocketChat.models.Rooms.muteUsernameByRoomId(room._id, username);
		}

		const extra = { open: true };

		if (username === owner.username) {
			extra.ls = now;
		}

		RocketChat.models.Subscriptions.createWithRoomAndUser(room, member, extra);
	}

	RocketChat.authz.addUserRoles(owner._id, ['owner'], room._id);

	if (type === 'c') {
		Meteor.defer(() => {
			RocketChat.callbacks.run('afterCreateChannel', owner, room);
		});
	} else if (type === 'p') {
		Meteor.defer(() => {
			RocketChat.callbacks.run('afterCreatePrivateGroup', owner, room);
		});
	}

	return {
		rid: room._id,
		name: slugifiedRoomName
	};
};
