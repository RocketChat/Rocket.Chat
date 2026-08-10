import { XMPPServer } from '@rocket.chat/core-services';
import { isRoomXMPPFederated, isUserXMPPFederated } from '@rocket.chat/core-typings';
import type { IRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';

import { callbacks } from '../../../../server/lib/callbacks';
import { prepareCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';
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
prepareCreateRoomCallback.add(
	({ extraData }) => {
		const data = extraData as Partial<IRoom> & { xmppFederated?: boolean };
		if (!data.xmppFederated) {
			return;
		}
		delete data.xmppFederated;

		if (!xmppEnabled() || data.federated) {
			return;
		}

		const name = data.name ?? '';
		const mucSubdomain = settings.get<string>('XMPP_Server_MUC_Subdomain') || 'conference';
		const domain = settings.get<string>('XMPP_Server_Domain');
		data.xmppFederation = { version: 1, role: 'host-muc', muc: `${name}@${mucSubdomain}.${domain}`, origin: domain };
	},
	callbacks.priority.HIGH,
	'xmpp-server-prepare-create-room',
);

// Register the hosted MUC room with the protocol core once the room exists.
callbacks.add(
	'afterCreateRoom',
	async (_owner, room) => {
		if (xmppEnabled() && isRoomXMPPFederated(room) && room.xmppFederation.role === 'host-muc') {
			await XMPPServer.registerHostedRoom(room);
		}
	},
	callbacks.priority.HIGH,
	'xmpp-server-after-create-room',
);
