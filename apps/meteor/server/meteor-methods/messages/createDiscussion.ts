import { AbacContractError } from '@rocket.chat/abac';
import { ClientSafeError, Message } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { afterSaveMessageAsync } from '../../hooks/messages/afterSaveMessage';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasAtLeastOnePermissionAsync } from '../../lib/authorization/hasPermission';
import { i18n } from '../../lib/i18n';
import { attachMessage } from '../../lib/messages/attachMessage';
import { sendMessage } from '../../lib/messages/sendMessage';
import { addUserToRoom } from '../../lib/rooms/addUserToRoom';
import { createRoom } from '../../lib/rooms/createRoom';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { settings } from '../../settings';

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
): Promise<IMessage> {
	return Message.saveSystemMessage('discussion-created', rid, msg, user, {
		drid,
		...(messageEmbedded && { attachments: [messageEmbedded] }),
	});
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
			throw new ClientSafeError('error-invalid-message', 'Invalid message', {
				method: 'DiscussionCreation',
			});
		}
		if (prid) {
			const parentRoom = await getParentRoom(message.rid);
			if (prid !== parentRoom?._id) {
				throw new ClientSafeError('error-invalid-arguments', 'Root message room ID does not match parent room ID ', {
					method: 'DiscussionCreation',
				});
			}
		} else {
			prid = message.rid;
		}
	}

	if (!prid) {
		throw new ClientSafeError('error-invalid-arguments', 'Missing parent room ID', { method: 'DiscussionCreation' });
	}

	let parentRoom;
	try {
		parentRoom = await canSendMessageAsync(prid, { uid: user._id, username: user.username, type: user.type });
	} catch (error) {
		if (error instanceof AbacContractError) {
			throw error;
		}
		throw new ClientSafeError((error as Error).message);
	}

	if (user.type !== 'app' && !(await Subscriptions.countByRoomIdAndUserId(parentRoom._id, user._id))) {
		throw new ClientSafeError('error-user-not-in-room', 'You must join the room to create a discussion', {
			method: 'DiscussionCreation',
		});
	}

	if (parentRoom.prid) {
		throw new ClientSafeError('error-nested-discussion', 'Cannot create nested discussions', {
			method: 'DiscussionCreation',
		});
	}

	if (typeof encrypted !== 'boolean') {
		encrypted = Boolean(parentRoom.encrypted);
	}

	if (encrypted && reply) {
		throw new ClientSafeError('error-invalid-arguments', 'Encrypted discussions must not receive an initial reply.', {
			method: 'DiscussionCreation',
		});
	}

	if (pmid) {
		// No projection: the full room is spread into the returned discussion below.
		const discussionAlreadyExists = await Rooms.findOne({
			prid,
			pmid,
		});
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
		throw new ClientSafeError('error-invalid-type', 'Cannot define discussion room type', {
			method: 'DiscussionCreation',
		});
	}

	if (
		type === 'p' &&
		!encrypted &&
		settings.get<boolean>('E2E_Enable') &&
		settings.get<boolean>('E2E_Force_Encryption_For_Private_Rooms')
	) {
		throw new ClientSafeError(
			'error-encrypted-private-rooms-enforced-discussion',
			'Workspace policy requires all private rooms to be encrypted. To create this discussion, make the parent channel public or enable encryption on it.',
			{ method: 'DiscussionCreation' },
		);
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
		afterSaveMessageAsync(discussionMsg, parentRoom, user);
	}

	return discussion;
};

export const createDiscussion = async (
	userId: string,
	{ prid, pmid, t_name: discussionName, reply, users, encrypted, topic }: Omit<CreateDiscussionProperties, 'user'>,
): Promise<
	IRoom & {
		rid: string;
	}
> => {
	if (!settings.get('Discussion_enabled')) {
		throw new ClientSafeError('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
	}

	if (!userId) {
		throw new ClientSafeError('error-unauthenticated', 'Unauthenticated', {
			method: 'DiscussionCreation',
		});
	}

	if (!(await hasAtLeastOnePermissionAsync(userId, ['start-discussion', 'start-discussion-other-user'], prid))) {
		throw new ClientSafeError('error-action-not-allowed', 'You are not allowed to create a discussion', { method: 'createDiscussion' });
	}
	const user = await Users.findOneById(userId, { projection: { services: 0 } });

	if (!user) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'createDiscussion',
		});
	}

	return create({ prid, pmid, t_name: discussionName, reply, users, user, encrypted, topic });
};
