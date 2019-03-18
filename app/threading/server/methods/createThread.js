/* UserRoles RoomRoles*/
// import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
// import { getAvatarUrlFromUsername } from '../../../utils';
import { hasAtLeastOnePermission, canAccessRoom } from '../../../authorization';
import { Messages, Rooms } from '../../../models';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib';

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

export const createThreadMessage = (rid, user, trid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		trid,
		attachments: [{
			fields,
		}, message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('thread-created', trid, '', user, welcomeMessage);
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

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;

	// threads are always created as private groups
	const thread = createRoom('p', name, user.username, [...new Set(invitedUsers)], false, {
		fname: t_name,
		description: message.msg, // TODO threads remove
		topic: p_room.name, // TODO threads remove
		prid,
	});

	if (pmid) {
		const clonedMessage = cloneMessage(message);

		Messages.update({
			_id: message._id,
		}, {
			...clonedMessage,
			attachments: [
				{ fields },
				...(message.attachments || []),
			],
			trid: thread._id,
		});

		mentionThreadMessage(thread._id, user, reply, attachMessage(message, p_room));

		// check if the message is in the latest 10 messages sent to the room
		// if not creates a new message saying about the thread creation
		const lastMessageIds = Messages.findByRoomId(message.rid, {
			sort: {
				ts: -1,
			},
			limit: 15,
			fields: {
				_id: 1,
			},
		}).fetch();

		if (!lastMessageIds.find((msg) => msg._id === message._id)) {
			createThreadMessage(message.rid, user, thread._id, reply, attachMessage(message, p_room));
		}
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
