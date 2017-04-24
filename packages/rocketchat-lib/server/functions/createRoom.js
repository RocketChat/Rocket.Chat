/* globals RocketChat */
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

	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}

	if (!nameValidation.test(name)) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'RocketChat.createRoom' });
	}

	const now = new Date();
	if (!_.contains(members, owner.username)) {
		members.push(owner.username);
	}

	// avoid duplicate names
	let room = RocketChat.models.Rooms.findOneByName(name);
	if (room) {
		if (room.archived) {
			throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${ name }`, { function: 'RocketChat.createRoom', room_name: name });
		} else {
			throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ name }' exists`, { function: 'RocketChat.createRoom', room_name: name });
		}
	}

	if (type === 'c') {
		RocketChat.callbacks.run('beforeCreateChannel', owner, {
			t: 'c',
			name,
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

	room = RocketChat.models.Rooms.createWithTypeNameUserAndUsernames(type, name, owner, members, extraData);

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
		rid: room._id
	};
};
