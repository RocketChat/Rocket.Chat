import type { IUser, SelectedAgent } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatContacts, LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';

import { notifyOnLivechatInquiryChanged } from '../../../../../app/lib/server/lib/notifyListener';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { migrateVisitorIfMissingContact } from '../../../../../app/livechat/server/lib/contacts/migrateVisitorIfMissingContact';
import { checkDefaultAgentOnNewRoom } from '../../../../../app/livechat/server/lib/hooks';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';

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
		const agent = await Users.findOneOnlineAgentById(id, settings.get<boolean>('Livechat_enabled_when_agent_idle'), {
			projection: { _id: 1, username: 1 },
		});
		if (agent) {
			return normalizeDefaultAgent(agent);
		}

		const offlineAgent = await Users.findOneAgentById(id, { projection: { _id: 1, username: 1 } });
		if (offlineAgent && settings.get('Livechat_accept_chats_with_no_agents')) {
			return normalizeDefaultAgent(offlineAgent);
		}

		return undefined;
	}

	return normalizeDefaultAgent(
		await Users.findOneOnlineAgentByUserList(
			username || [],
			{ projection: { _id: 1, username: 1 } },
			settings.get<boolean>('Livechat_enabled_when_agent_idle'),
		),
	);
};

settings.watch<boolean>('Livechat_last_chatted_agent_routing', (value) => {
	if (!value) {
		callbacks.remove('livechat.onMaxNumberSimultaneousChatsReached', 'livechat-on-max-number-simultaneous-chats-reached');
		return;
	}

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

checkDefaultAgentOnNewRoom.patch(async (_next, defaultAgent, { visitorId, source } = {}) => {
	if (!visitorId || !source) {
		return defaultAgent;
	}

	const guest = await LivechatVisitors.findOneEnabledById(visitorId, {
		projection: { lastAgent: 1, token: 1, contactManager: 1 },
	});
	if (!guest) {
		return defaultAgent;
	}

	const hasDivergentContactManager = defaultAgent?.agentId !== guest?.contactManager;
	if (!hasDivergentContactManager && defaultAgent) {
		return defaultAgent;
	}

	const contactId = await migrateVisitorIfMissingContact(visitorId, source);
	const contact = contactId ? await LivechatContacts.findOneById(contactId, { projection: { contactManager: 1 } }) : undefined;

	const contactManagerPreferred = settings.get<boolean>('Omnichannel_contact_manager_routing');
	const guestManager = contactManagerPreferred && (await getDefaultAgent({ id: contact?.contactManager }));
	if (guestManager) {
		return guestManager;
	}

	if (!settings.get<boolean>('Livechat_last_chatted_agent_routing')) {
		return defaultAgent;
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
		return defaultAgent;
	}

	const {
		servedBy: { username: usernameByRoom },
	} = room;
	if (!usernameByRoom) {
		return defaultAgent;
	}
	const lastRoomAgent = normalizeDefaultAgent(
		await Users.findOneOnlineAgentByUserList(
			usernameByRoom,
			{ projection: { _id: 1, username: 1 } },
			settings.get<boolean>('Livechat_enabled_when_agent_idle'),
		),
	);
	return lastRoomAgent;
});
