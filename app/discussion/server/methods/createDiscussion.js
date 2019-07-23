import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { hasAtLeastOnePermission, canAccessRoom } from '../../../authorization/server';
import { Messages, Rooms } from '../../../models/server';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib/server';
import { settings } from '../../../settings/server';

const getParentRoom = (rid) => {
	const room = Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { fields: { _id: 1 } }) : room);
};

const createDiscussionMessage = (rid, user, drid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		drid,
		attachments: [message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('discussion-created', rid, '', user, welcomeMessage);
};

const mentionMessage = (rid, { _id, username, name }, message_embedded) => {
	const welcomeMessage = {
		rid,
		u: { _id, username, name },
		ts: new Date(),
		_updatedAt: new Date(),
		attachments: [message_embedded].filter((e) => e),
	};

	return Messages.insert(welcomeMessage);
};

const create = ({ prid, pmid, t_name, reply, users }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (pmid) {
		message = Messages.findOne({ _id: pmid });
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { method: 'DiscussionCreation' });
		}
		if (prid) {
			if (prid !== getParentRoom(message.rid)._id) {
				throw new Meteor.Error('error-invalid-arguments', { method: 'DiscussionCreation' });
			}
		} else {
			prid = message.rid;
		}
	}

	if (!prid) {
		throw new Meteor.Error('error-invalid-arguments', { method: 'DiscussionCreation' });
	}

	const p_room = Rooms.findOne(prid);
	if (!p_room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'DiscussionCreation' });
	}
	if (p_room.prid) {
		throw new Meteor.Error('error-nested-discussion', 'Cannot create nested discussions', { method: 'DiscussionCreation' });
	}

	const user = Meteor.user();

	if (!canAccessRoom(p_room, user)) {
		throw new Meteor.Error('error-not-allowed', { method: 'DiscussionCreation' });
	}

	if (pmid) {
		const discussionAlreadyExists = Rooms.findOne({
			prid,
			pmid,
		}, {
			fields: { _id: 1 },
		});
		if (discussionAlreadyExists) { // do not allow multiple discussions to the same message'\
			addUserToRoom(discussionAlreadyExists._id, user);
			return discussionAlreadyExists;
		}
	}

	const name = Random.id();

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;

	// discussions are always created as private groups
	const discussion = createRoom('p', name, user.username, [...new Set(invitedUsers)], false, {
		fname: t_name,
		description: message.msg, // TODO discussions remove
		topic: p_room.name, // TODO discussions remove
		prid,
	}, {
		// overrides name validation to allow anything, because discussion's name is randomly generated
		nameValidationRegex: /.*/,
	});

	if (pmid) {
		mentionMessage(discussion._id, user, attachMessage(message, p_room));

		createDiscussionMessage(message.rid, user, discussion._id, t_name, attachMessage(message, p_room));
	} else {
		createDiscussionMessage(prid, user, discussion._id, t_name);
	}

	if (reply) {
		sendMessage(user, { msg: reply }, discussion);
	}
	return discussion;
};

Meteor.methods({
	/**
	* Create discussion by room or message
	* @constructor
	* @param {string} prid - Parent Room Id - The room id, optional if you send pmid.
	* @param {string} pmid - Parent Message Id - Create the discussion by a message, optional.
	* @param {string} reply - The reply, optional
	* @param {string} t_name - discussion name
	* @param {string[]} users - users to be added
	*/
	createDiscussion({ prid, pmid, t_name, reply, users }) {
		if (!settings.get('Discussion_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'DiscussionCreation' });
		}

		if (!hasAtLeastOnePermission(uid, ['start-discussion', 'start-discussion-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		return create({ uid, prid, pmid, t_name, reply, users });
	},
});
