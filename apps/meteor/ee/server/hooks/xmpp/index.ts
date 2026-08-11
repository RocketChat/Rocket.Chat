import { MeteorError, XMPPServer } from '@rocket.chat/core-services';
import { isRoomXMPPFederated, isRoomXMPPHostedMuc, isRoomXMPPRemoteMuc, isUserXMPPFederated } from '@rocket.chat/core-typings';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Subscriptions, Users } from '@rocket.chat/models';
import { escapeLocalpart } from '@rocket.chat/xmpp-server';

import { callbacks } from '../../../../server/lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../server/lib/callbacks/afterLeaveRoomCallback';
import { afterRemoveFromRoomCallback } from '../../../../server/lib/callbacks/afterRemoveFromRoomCallback';
import { beforeAddUsersToRoom } from '../../../../server/lib/callbacks/beforeAddUserToRoom';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';
import { settings } from '../../../../server/settings';

const logger = new Logger('XMPPServerHooks');

/** A bare JID has an `@` but no `:` (which would make it a Matrix MXID). */
const isBareJid = (value: unknown): value is string => typeof value === 'string' && value.includes('@') && !value.includes(':');

const xmppEnabled = (): boolean => settings.get<boolean>('XMPP_Server_Enabled') && settings.get<string>('XMPP_Server_Domain') !== '';

callbacks.add(
	'afterSaveMessage',
	async (message, { room, user }) => {
		if (!isRoomXMPPFederated(room)) {
			return;
		}
		// Inbound messages are persisted with a federation.eventId stamp — never echo them back.
		if (message.federation?.eventId || message.t || isUserXMPPFederated(user)) {
			return;
		}

		try {
			await XMPPServer.sendMessage(message, room, user);
		} catch (error) {
			logger.error({ msg: 'Failed to relay message to XMPP', err: error });
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-after-save-message',
);

// Matrix's federation.beforeCreateDirectMessage only matches MXIDs (':' AND '@'),
// so bare JIDs fall through to this handler.
callbacks.add('federation.beforeCreateDirectMessage', async (roomUsers, extraData) => {
	if (!xmppEnabled()) {
		return;
	}

	// roomUsers holds still-unresolved usernames/JIDs as strings at this stage
	const jid = (roomUsers as unknown as unknown[]).find(isBareJid);
	if (jid) {
		extraData.xmppFederation = {
			version: 1,
			role: 'dm',
			with: jid,
			origin: jid.split('@').pop() as string,
		};
	}
});

// Materialize remote XMPP users as local records before subscriptions are created.
callbacks.add(
	'beforeCreateDirectRoom',
	async (members, room) => {
		if (!xmppEnabled() || !isRoomXMPPFederated(room)) {
			return;
		}
		const jids = members.filter((member): member is string => isBareJid(member));
		if (jids.length) {
			await XMPPServer.ensureXMPPUsersExistLocally(jids);
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-before-create-direct-room',
);

// The create-channel modal sends a transient `xmppFederated` boolean; convert it into
// the persisted room marker. Never coexist with Matrix federation on the same room.
// Runs on beforeCreateRoom rather than prepareCreateRoom because the MUC localpart must be
// the final room name, which prepareCreateRoom does not receive (name is not in extraData).
beforeCreateRoomCallback.add(
	({ room }) => {
		const data = room as Omit<IRoom, '_id' | '_updatedAt'> & { xmppFederated?: boolean };
		if (!data.xmppFederated) {
			return;
		}
		delete data.xmppFederated;

		if (!xmppEnabled() || data.federated || !data.name) {
			return;
		}

		const mucSubdomain = settings.get<string>('XMPP_Server_MUC_Subdomain') || 'conference';
		const domain = settings.get<string>('XMPP_Server_Domain');
		data.xmppFederation = {
			version: 1,
			role: 'host-muc',
			muc: `${escapeLocalpart(data.name)}@${mucSubdomain}.${domain}`,
			origin: domain,
		};
	},
	callbacks.priority.HIGH,
	'xmpp-server-before-create-room',
);

// Register the hosted MUC room with the protocol core once the room exists, then publish
// its initial members: locals as virtual occupants, remote JIDs get an invitation.
callbacks.add(
	'afterCreateRoom',
	async (owner, room) => {
		if (!xmppEnabled() || !isRoomXMPPHostedMuc(room)) {
			return;
		}
		await XMPPServer.registerHostedRoom(room);

		// Members added at creation time never go through addUserToRoom, so afterAddedToRoom does not fire for them
		const members = await Subscriptions.findByRoomId(room._id, { projection: { 'u._id': 1 } }).toArray();
		for (const { u } of members) {
			await syncHostedRoomMember(room, u._id, owner._id).catch((error) =>
				logger.error({ msg: 'Failed to publish initial hosted MUC member', err: error }),
			);
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-after-create-room',
);

/** Publishes one member of a hosted room to XMPP: an invite for remote users, an occupant for locals. */
async function syncHostedRoomMember(room: IRoom, userId: string, inviterId?: string): Promise<void> {
	const user = await Users.findOneById(userId, { projection: { username: 1, federated: 1, xmppFederation: 1 } });
	if (!user) {
		return;
	}

	if (!isUserXMPPFederated(user)) {
		await XMPPServer.addHostedRoomMember(room._id, userId);
		return;
	}

	// Remote users cannot be invited by another remote user, and a self-join has no inviter to speak for
	if (user.username && inviterId && inviterId !== userId) {
		await XMPPServer.inviteToHostedRoom(room._id, inviterId, user.username);
	}
}

// Remote XMPP users are addressed by bare JID and may not exist locally yet.
beforeAddUsersToRoom.add(
	async ({ usernames }, room) => {
		const jids = usernames.filter(isBareJid);
		if (!jids.length) {
			return;
		}

		if (!isRoomXMPPHostedMuc(room)) {
			throw new MeteorError('error-xmpp-users-in-non-xmpp-rooms', 'Cannot add XMPP users to non-XMPP-federated rooms');
		}

		// With the feature off nothing may be materialized; the JID then fails to resolve as a user
		if (xmppEnabled()) {
			await XMPPServer.ensureXMPPUsersExistLocally(jids);
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-before-add-users-to-room',
);

// A member was added to (or joined) an XMPP room after creation.
callbacks.add(
	'afterAddedToRoom',
	async ({ user, inviter }, room) => {
		if (!xmppEnabled()) {
			return;
		}

		try {
			// Every local member of a mirrored remote room needs their own MUC session,
			// otherwise their messages have no occupant to be sent as.
			if (isRoomXMPPRemoteMuc(room)) {
				await XMPPServer.joinRemoteMUC(user._id, room._id);
				return;
			}

			if (!isRoomXMPPHostedMuc(room)) {
				return;
			}
			// An inviter who is themselves remote means the membership originated on the wire
			if (inviter && isUserXMPPFederated(inviter)) {
				return;
			}
			await syncHostedRoomMember(room, user._id, inviter?._id);
		} catch (error) {
			logger.error({ msg: 'Failed to publish XMPP room member', err: error });
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-after-added-to-room',
);

const withdrawRoomMember = async ({ user }: { user: IUser }, room: IRoom): Promise<void> => {
	if (!xmppEnabled()) {
		return;
	}
	try {
		if (isRoomXMPPRemoteMuc(room)) {
			await XMPPServer.leaveRemoteMUC(user._id, room._id);
			return;
		}
		if (isRoomXMPPHostedMuc(room)) {
			await XMPPServer.removeHostedRoomMember(room._id, user._id);
		}
	} catch (error) {
		logger.error({ msg: 'Failed to withdraw XMPP room member', err: error });
	}
};

afterLeaveRoomCallback.add(withdrawRoomMember, callbacks.priority.HIGH, 'xmpp-server-after-leave-room');
afterRemoveFromRoomCallback.add(
	async ({ removedUser }, room) => withdrawRoomMember({ user: removedUser }, room),
	callbacks.priority.HIGH,
	'xmpp-server-after-remove-from-room',
);
