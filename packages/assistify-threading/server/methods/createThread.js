/* UserRoles RoomRoles*/
// import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
// import { getAvatarUrlFromUsername } from 'meteor/rocketchat:utils';
import { hasAtLeastOnePermission, canAccessRoom } from 'meteor/rocketchat:authorization';
import { Messages, Rooms } from 'meteor/rocketchat:models';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from 'meteor/rocketchat:lib';

const fields = [
	{
		type: 'messageCounter',
		count: 0,
	},
	{
		type: 'lastMessageAge',
		lm: null,
	},
];

export const createThreadMessage = (rid, user, t_rid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		t_rid,
		attachments: [{
			fields,
		}, message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('thread-created', t_rid, '', user, welcomeMessage);
};

export const mentionThreadMessage = (rid, user, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		attachments: [message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('thread-created', rid, '', user, welcomeMessage);
};

const cloneMessage = ({ _id, ...msg }) => ({ ...msg });

export const create = ({ prid, pmid, t_name, reply, users }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (pmid) {
		message = Messages.findOne({ _id: pmid });
		if (prid) {
			if (prid !== message.rid) {
				throw new Meteor.Error('error-invalid-arguments', { method: 'ThreadCreation' });
			}
		} else {
			prid = message.rid;
		}
	}

	if (!prid) {
		throw new Meteor.Error('error-invalid-arguments', { method: 'ThreadCreation' });
	}
	const p_room = Rooms.findOne(prid);

	if (p_room.prid) {
		throw new Meteor.Error('error-nested-thread', 'Cannot create nested threads', { method: 'ThreadCreation' });
	}

	const user = Meteor.user();

	if (!canAccessRoom(p_room, user)) {
		throw new Meteor.Error('error-not-allowed', { method: 'ThreadCreation' });
	}

	if (pmid) {
		const threadAlreadyExists = Rooms.findOne({
			prid,
			pmid,
		}, {
			fields: { _id: 1 },
		});
		if (threadAlreadyExists) { // do not allow multiple threads to the same message'\
			addUserToRoom(threadAlreadyExists._id, user);
			return threadAlreadyExists;
		}
	}

	const name = Random.id();

	const invitedUsers = message ? [message.u.username, ...users] : users; // auto invite the replied message owner

	// threads are always created as private groups
	const thread = createRoom('p', name, user.username, invitedUsers, false, {
		fname: t_name,
		description: message.msg, // TODO threads remove
		topic: p_room.name, // TODO threads remove
		prid,
	});

	if (pmid) {
		const message_cloned = cloneMessage(message);

		Messages.update({
			_id: message._id,
		}, {
			...message_cloned,
			attachments: [{
				fields,
			}, ...(message_cloned.attachments || [])],
			t_rid: thread._id,
		});


		mentionThreadMessage(thread._id, user, reply, attachMessage(message_cloned, p_room));

		// Messages.insert({
		// 	...message_cloned,
		// 	rid: thread._id,
		// });
	} else {
		createThreadMessage(prid, user, thread._id, reply);
		if (reply) {
			sendMessage(user, { msg: reply }, thread);
		}
	}
	return thread;
};

Meteor.methods({
	/**
	* Create thread by room or message
	* @constructor
	* @param {string} prid - Parent Room Id - The room id, optional if you send pmid.
	* @param {string} pmid - Parent Message Id - Create the thread by a message, optional.
	* @param {string} reply - The reply, optional
	* @param {string} t_name - thread name
	* @param {string[]} users - users to be added
	*/
	createThread({ prid, pmid, t_name, reply, users }) {

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ThreadCreation' });
		}

		if (!hasAtLeastOnePermission(uid, ['start-thread', 'start-thread-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a thread', { method: 'createThread' });
		}

		return create({ uid, prid, pmid, t_name, reply, users });
	},
});
