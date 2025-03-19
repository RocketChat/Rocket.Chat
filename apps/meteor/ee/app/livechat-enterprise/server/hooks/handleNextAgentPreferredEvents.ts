import type { IUser, SelectedAgent } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatContacts, LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';

import { notifyOnLivechatInquiryChanged } from '../../../../../app/lib/server/lib/notifyListener';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { migrateVisitorIfMissingContact } from '../../../../../app/livechat/server/lib/contacts/migrateVisitorIfMissingContact';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

let contactManagerPreferred = false;
let lastChattedAgentPreferred = false;

const normalizeDefaultAgent = (agent?: Pick<IUser, '_id' | 'username'> | null): SelectedAgent | undefined => {
	if (!agent) {
		return undefined;
	}

	const { _id: agentId, username } = agent;
	return { agentId, username };
};

const getDefaultAgent = async ({ username, id }: { username?: string; id?: string }): Promise<SelectedAgent | undefined> => {
	if (!username && !id) {
		return undefined;
	}

	if (id) {
		const agent = await Users.findOneOnlineAgentById(id, undefined, { projection: { _id: 1, username: 1 } });
		if (agent) {
			return normalizeDefaultAgent(agent);
		}

		const offlineAgent = await Users.findOneAgentById(id, { projection: { _id: 1, username: 1 } });
		if (offlineAgent && settings.get('Livechat_accept_chats_with_no_agents')) {
			return normalizeDefaultAgent(offlineAgent);
		}

		return undefined;
	}

	return normalizeDefaultAgent(await Users.findOneOnlineAgentByUserList(username || [], { projection: { _id: 1, username: 1 } }));
};

settings.watch<boolean>('Livechat_last_chatted_agent_routing', (value) => {
	lastChattedAgentPreferred = value;
	if (!lastChattedAgentPreferred) {
		callbacks.remove('livechat.onMaxNumberSimultaneousChatsReached', 'livechat-on-max-number-simultaneous-chats-reached');
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-save-default-agent-after-take-inquiry');
		return;
	}

	callbacks.add(
		'livechat.afterTakeInquiry',
		async ({ inquiry }, agent) => {
			if (!inquiry || !agent) {
				return inquiry;
			}

			if (!RoutingManager.getConfig()?.autoAssignAgent) {
				return inquiry;
			}

			const { v: { token } = {} } = inquiry;
			if (!token) {
				return inquiry;
			}

			await LivechatVisitors.updateLastAgentByToken(token, { ...agent, ts: new Date() });

			return inquiry;
		},
		callbacks.priority.MEDIUM,
		'livechat-save-default-agent-after-take-inquiry',
	);

	callbacks.add(
		'livechat.onMaxNumberSimultaneousChatsReached',
		async (inquiry) => {
			if (!inquiry?.defaultAgent) {
				return inquiry;
			}

			if (!RoutingManager.getConfig()?.autoAssignAgent) {
				return inquiry;
			}

			await LivechatInquiry.removeDefaultAgentById(inquiry._id);

			void notifyOnLivechatInquiryChanged(inquiry, 'updated', {
				defaultAgent: undefined,
			});

			return LivechatInquiry.findOneById(inquiry._id);
		},
		callbacks.priority.MEDIUM,
		'livechat-on-max-number-simultaneous-chats-reached',
	);
});

settings.watch<boolean>('Omnichannel_contact_manager_routing', (value) => {
	contactManagerPreferred = value;
});

callbacks.add(
	'livechat.checkDefaultAgentOnNewRoom',
	async (defaultAgent, { visitorId, source } = {}) => {
		if (!visitorId || !source) {
			return defaultAgent;
		}

		const guest = await LivechatVisitors.findOneEnabledById(visitorId, {
			projection: { lastAgent: 1, token: 1, contactManager: 1 },
		});
		if (!guest) {
			return undefined;
		}

		const hasDivergentContactManager = defaultAgent?.agentId !== guest?.contactManager;
		if (!hasDivergentContactManager && defaultAgent) {
			return defaultAgent;
		}

		const contactId = await migrateVisitorIfMissingContact(visitorId, source);
		const contact = contactId ? await LivechatContacts.findOneById(contactId, { projection: { contactManager: 1 } }) : undefined;

		const guestManager = contactManagerPreferred && (await getDefaultAgent({ id: contact?.contactManager }));
		if (guestManager) {
			return guestManager;
		}

		if (!lastChattedAgentPreferred) {
			return undefined;
		}

		const { lastAgent, token } = guest;
		const guestAgent = await getDefaultAgent({ username: lastAgent?.username });
		if (guestAgent) {
			return guestAgent;
		}

		const room = await LivechatRooms.findOneLastServedAndClosedByVisitorToken(token, {
			projection: { servedBy: 1 },
		});
		if (!room?.servedBy) {
			return undefined;
		}

		const {
			servedBy: { username: usernameByRoom },
		} = room;
		if (!usernameByRoom) {
			return undefined;
		}
		const lastRoomAgent = normalizeDefaultAgent(
			await Users.findOneOnlineAgentByUserList(usernameByRoom, { projection: { _id: 1, username: 1 } }),
		);
		return lastRoomAgent;
	},
	callbacks.priority.MEDIUM,
	'livechat-check-default-agent-new-room',
);
