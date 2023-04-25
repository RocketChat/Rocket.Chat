import { Meteor } from 'meteor/meteor';
import { Random } from '@rocket.chat/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage, IRoom, IUser, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Messages, Rooms } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';

import { hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { createRoom, addUserToRoom, sendMessage, attachMessage } from '../../../lib/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

const getParentRoom = async (rid: IRoom['_id']) => {
	const room = await Rooms.findOne(rid);
	return room && (room.prid ? Rooms.findOne(room.prid, { projection: { _id: 1 } }) : room);
};

async function createDiscussionMessage(
	rid: IRoom['_id'],
	user: IUser,
	drid: IRoom['_id'],
	msg: IMessage['msg'],
	messageEmbedded?: MessageAttachmentDefault,
): Promise<IMessage | null> {
	const msgId = await Message.saveSystemMessage('discussion-created', rid, msg, user, {
		drid,
		...(messageEmbedded && { attachments: [messageEmbedded] }),
	});

	return Messages.findOneById(msgId);
}

async function mentionMessage(
	rid: IRoom['_id'],
	{ _id, username, name }: Pick<IUser, '_id' | 'username' | 'name'>,
	messageEmbedded?: MessageAttachmentDefault,
) {
	if (!username) {
		return null;
	}
	await Messages.insertOne({
		rid,
		msg: '',
		u: { _id, username, name },
		ts: new Date(),
		_updatedAt: new Date(),
		...(messageEmbedded && { attachments: [messageEmbedded] }),
	});
}

type CreateDiscussionProperties = {
	prid: IRoom['_id'];
	pmid?: IMessage['_id'];
	t_name: string;
	reply?: string;
	users: Array<Exclude<IUser['username'], undefined>>;
	user: IUser;
	encrypted?: boolean;
};

const create = async ({ prid, pmid, t_name: discussionName, reply, users, user, encrypted }: CreateDiscussionProperties) => {
	// if you set both, prid and pmid, and the rooms dont match... should throw an error)
	let message: null | IMessage = null;
	if (pmid) {
		message = await Messages.findOneById(pmid);
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', {
				method: 'DiscussionCreation',
			});
		}
		if (prid) {
			const parentRoom = await getParentRoom(message.rid);
			if (!parentRoom || prid !== parentRoom._id) {
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
		parentRoom = await canSendMessageAsync(prid, { uid: user._id, username: user.username, type: user.type });
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
		const discussionAlreadyExists = await Rooms.findOne(
			{
				prid,
				pmid,
			},
			{
				projection: { _id: 1 },
			},
		);
		if (discussionAlreadyExists) {
			// do not allow multiple discussions to the same message'\
			await addUserToRoom(discussionAlreadyExists._id, user);
			return discussionAlreadyExists;
		}
	}

	const name = Random.id();

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;

	const type = await roomCoordinator.getRoomDirectives(parentRoom.t).getDiscussionType(parentRoom);
	const description = parentRoom.encrypted ? '' : message?.msg;
	const topic = parentRoom.name;

	if (!type) {
		throw new Meteor.Error('error-invalid-type', 'Cannot define discussion room type', {
			method: 'DiscussionCreation',
		});
	}

	const discussion = await createRoom(
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
		await mentionMessage(discussion._id, user, attachMessage(message, parentRoom));

		discussionMsg = await createDiscussionMessage(message.rid, user, discussion._id, discussionName, attachMessage(message, parentRoom));
	} else {
		discussionMsg = await createDiscussionMessage(prid, user, discussion._id, discussionName);
	}

	if (discussionMsg) {
		callbacks.runAsync('afterSaveMessage', discussionMsg, parentRoom);
	}

	if (reply) {
		await sendMessage(user, { msg: reply }, discussion);
	}
	return discussion;
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createDiscussion: typeof create;
	}
}

Meteor.methods<ServerMethods>({
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
	async createDiscussion({ prid, pmid, t_name: discussionName, reply, users, encrypted }: CreateDiscussionProperties) {
		if (!settings.get('Discussion_enabled')) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'DiscussionCreation',
			});
		}

		if (!(await hasAtLeastOnePermissionAsync(uid, ['start-discussion', 'start-discussion-other-user']))) {
			throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
		}

		return create({ prid, pmid, t_name: discussionName, reply, users, user: (await Meteor.userAsync()) as IUser, encrypted });
	},
});
