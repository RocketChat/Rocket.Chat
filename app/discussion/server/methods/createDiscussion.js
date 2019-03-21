/* UserRoles RoomRoles*/
// import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
// import { getAvatarUrlFromUsername } from '../../../utils';
import { hasAtLeastOnePermission, canAccessRoom } from '../../../authorization';
import { Messages, Rooms } from '../../../models';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib';

import { settings } from '../../../settings';
import { Discussion } from '../constants';

const getParentRoom = (rid) => {
	const room = Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { fields: { _id: 1 } }) : room);
};

export const createDiscussionMessage = (rid, user, trid, msg, message_embedded) => {
	const welcomeMessage = {
		msg,
		rid,
		trid,
		attachments: [message_embedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('discussion-created', rid, '', user, welcomeMessage);
};

export const mentionDiscussionMessage = (rid, { _id, username, name }, message_embedded) => {
	const welcomeMessage = {
		rid,
		u: { _id, username, name },
		ts: new Date(),
		_updatedAt: new Date(),
		attachments: [message_embedded].filter((e) => e),
	};

	return Messages.insert(welcomeMessage);
};

export const create = ({ prid, pmid, t_name, reply, users }) => {
	// if you set both, prid and pmid, and the rooms doesnt match... should throw an error)
	let message = false;
	if (pmid) {
		message = Messages.findOne({ _id: pmid });
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
	});

	const fields = {
		tcount: 0,
		tlm: null,
	};


	if (pmid) {

		const sendCreationMessage = settings.get('Discussion_send_creation_message');

		mentionDiscussionMessage(discussion._id, user, attachMessage(message, p_room));

		switch (sendCreationMessage) {
			default:
			case Discussion.SEND_CREATION_MESSAGE.OLD_MESSAGES:
				Messages.update({
					_id: message._id,
				}, {
					$set: {
						trid: discussion._id,
						...fields,
					},
				});

				// check if the message is in the latest 10 messages sent to the room
				// if not creates a new message saying about the discussion creation
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
					createDiscussionMessage(message.rid, user, discussion._id, t_name, attachMessage(message, p_room));
				}
				break;
			case Discussion.SEND_CREATION_MESSAGE.NEVER:

				Messages.update({
					_id: message._id,
				}, {
					$set : {
						trid: discussion._id,
						...fields,
					},
				});
				break;
			case Discussion.SEND_CREATION_MESSAGE.ALWAYS:
				createDiscussionMessage(message.rid, user, discussion._id, t_name, attachMessage(message, p_room));
				break;
		}


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
