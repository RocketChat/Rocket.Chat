import { Message } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../../server/lib/i18n';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { attachMessage } from '../../../lib/server/functions/attachMessage';
import { createRoom } from '../../../lib/server/functions/createRoom';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { afterSaveMessageAsync } from '../../../lib/server/lib/afterSaveMessage';
import { settings } from '../../../settings/server';

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
	topic?: string;
};

const create = async ({
	prid,
	pmid,
	t_name: discussionName,
	reply,
	users,
	user,
	encrypted,
	topic,
}: CreateDiscussionProperties): Promise<IRoom & { rid: string }> => {
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
			return { ...discussionAlreadyExists, rid: discussionAlreadyExists._id };
		}
	}

	const name = Random.id();

	// auto invite the replied message owner
	const invitedUsers = message ? [message.u.username, ...users] : users;

	const type = await roomCoordinator.getRoomDirectives(parentRoom.t).getDiscussionType(parentRoom);
	const description = parentRoom.encrypted ? '' : message?.msg;
	const discussionTopic = topic || parentRoom.name;

	if (!type) {
		throw new Meteor.Error('error-invalid-type', 'Cannot define discussion room type', {
			method: 'DiscussionCreation',
		});
	}

	const discussion = await createRoom(
		type,
		name,
		user,
		[...new Set(invitedUsers)].filter(Boolean),
		false,
		false,
		{
			fname: discussionName,
			description, // TODO discussions remove
			topic: discussionTopic,
			prid,
			encrypted,
		},
		{
			creator: user._id,
		},
	);

	let discussionMsg;
	if (message) {
		if (parentRoom.encrypted) {
			message.msg = i18n.t('Encrypted_message');
		}
		await mentionMessage(discussion._id, user, attachMessage(message, parentRoom));

		discussionMsg = await createDiscussionMessage(message.rid, user, discussion._id, discussionName, attachMessage(message, parentRoom));
	} else {
		discussionMsg = await createDiscussionMessage(prid, user, discussion._id, discussionName);
	}

	if (reply) {
		await sendMessage(user, { msg: reply }, discussion);
	}

	if (discussionMsg) {
		afterSaveMessageAsync(discussionMsg, parentRoom);
	}

	return discussion;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createDiscussion: typeof create;
	}
}

export const createDiscussion = async (
	userId: string,
	{ prid, pmid, t_name: discussionName, reply, users, encrypted, topic }: Omit<CreateDiscussionProperties, 'user'>,
): Promise<
	IRoom & {
		rid: string;
	}
> => {
	if (!settings.get('Discussion_enabled')) {
		throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
	}

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'DiscussionCreation',
		});
	}

	if (!(await hasAtLeastOnePermissionAsync(userId, ['start-discussion', 'start-discussion-other-user'], prid))) {
		throw new Meteor.Error('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
	}
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createDiscussion',
		});
	}

	return create({ prid, pmid, t_name: discussionName, reply, users, user, encrypted, topic });
};

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
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'DiscussionCreation',
			});
		}

		return createDiscussion(uid, { prid, pmid, t_name: discussionName, reply, users, encrypted });
	},
});
