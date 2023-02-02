import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage, IRoom, IUser, MessageAttachmentDefault } from '@rocket.chat/core-typings';

import { hasAtLeastOnePermission, canSendMessage } from '../../../authorization/server';
import { Messages, Rooms } from '../../../models/server';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const getParentRoom = (rid: IRoom['_id']) => {
	const room = Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { fields: { _id: 1 } }) : room);
};

const createDiscussionMessage = (
	rid: IRoom['_id'],
	user: IUser,
	drid: IRoom['_id'],
	msg: IMessage['msg'],
	messageEmbedded?: MessageAttachmentDefault,
): IMessage => {
	const welcomeMessage = {
		msg,
		rid,
		drid,
		attachments: [messageEmbedded].filter((e) => e),
	};
	return Messages.createWithTypeRoomIdMessageAndUser('discussion-created', rid, '', user, welcomeMessage) as IMessage;
};

const mentionMessage = (
	rid: IRoom['_id'],
	{ _id, username, name }: Pick<IUser, '_id' | 'name' | 'username'>,
	messageEmbedded?: MessageAttachmentDefault,
) => {
	const welcomeMessage = {
		rid,
		u: { _id, username, name },
		ts: new Date(),
		_updatedAt: new Date(),
		attachments: [messageEmbedded].filter((e) => e),
	};

	return Messages.insert(welcomeMessage);
};

type CreateDiscussionProperties = {
	prid: IRoom['_id'];
	pmid?: IMessage['_id'];
	t_name: string;
	reply?: string;
	users: Array<Exclude<IUser['username'], undefined>>;
	user: IUser;
	encrypted?: boolean;
};

const create = ({ prid, pmid, t_name: discussionName, reply, users, user, encrypted }: CreateDiscussionProperties) => {
	// if you set both, prid and pmid, and the rooms dont match... should throw an error)
	let message: undefined | IMessage;
	if (pmid) {
		message = Messages.findOne({ _id: pmid }) as IMessage | undefined;
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'DiscussionCreation',
			});
		}
		if (prid) {
			if (prid !== getParentRoom(message.rid)._id) {
				throw new Meteor.Error('error-invalid-arguments', 'Root message room ID does not match parent room ID ', {
					method: 'DiscussionCreation',
				});
			}
		} else {
			prid = message.rid;
		}
	}

	if (!prid) {
		throw new Meteor.Error('error-invalid-arguments', 'Missing parent room ID', { method: 'DiscussionCreation' });
	}

	let parentRoom;
	try {
		parentRoom = canSendMessage(prid, { uid: user._id, username: user.username, type: user.type });
	} catch (error) {
		throw new Meteor.Error((error as Error).message);
	}

	if (parentRoom.prid) {
		throw new Meteor.Error('error-nested-discussion', 'Cannot create nested discussions', {
			method: 'DiscussionCreation',
		});
	}

	if (typeof encrypted !== 'boolean') {
		encrypted = Boolean(parentRoom.encrypted);
	}

	if (encrypted && reply) {
		throw new Meteor.Error('error-invalid-arguments', 'Encrypted discussions must not receive an initial reply.', {
			method: 'DiscussionCreation',
		});
	}

	if (pmid) {
		const discussionAlreadyExists = Rooms.findOne(
			{
				prid,
				pmid,
			},
			{
				fields: { _id: 1 },
			},
		);
		if (discussionAlreadyExists) {
			// do not allow multiple discussions to the same message'\
			addUserToRoom(discussionAlreadyExists._id, user);
			return discussionAlreadyExists;
		}
	}

	const name = Random.id();

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;

	const type = roomCoordinator.getRoomDirectives(parentRoom.t)?.getDiscussionType(parentRoom);
	const description = parentRoom.encrypted ? '' : message?.msg;
	const topic = parentRoom.name;

	if (!type) {
		throw new Meteor.Error('error-invalid-type', 'Cannot define discussion room type', {
			method: 'DiscussionCreation',
		});
	}

	const discussion = createRoom(
		type,
		name,
		user.username as string,
		[...new Set(invitedUsers)].filter(Boolean),
		false,
		{
			fname: discussionName,
			description, // TODO discussions remove
			topic, // TODO discussions remove
			prid,
			encrypted,
		},
		{
			// overrides name validation to allow anything, because discussion's name is randomly generated
			nameValidationRegex: '.*',
			creator: user._id,
		},
	);

	let discussionMsg;
	if (message) {
		if (parentRoom.encrypted) {
			message.msg = TAPi18n.__('Encrypted_message');
		}
		mentionMessage(discussion._id, user, attachMessage(message, parentRoom));

		discussionMsg = createDiscussionMessage(message.rid, user, discussion._id, discussionName, attachMessage(message, parentRoom));
	} else {
		discussionMsg = createDiscussionMessage(prid, user, discussion._id, discussionName);
	}

	callbacks.runAsync('afterSaveMessage', discussionMsg, parentRoom);

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
	 * @param {boolean} encrypted - if the discussion's e2e encryption should be enabled.
	 */
	createDiscussion({ prid, pmid, t_name: discussionName, reply, users, encrypted }: CreateDiscussionProperties) {
		if (!settings.get('Discussion_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'DiscussionCreation',
			});
		}

		if (!hasAtLeastOnePermission(uid, ['start-discussion', 'start-discussion-other-user'])) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		return create({ prid, pmid, t_name: discussionName, reply, users, user: Meteor.user() as IUser, encrypted });
	},
});
