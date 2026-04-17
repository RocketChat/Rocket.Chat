import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

/**
 * Builds the query to find online and available agents for livechat auto-assignment.
 * * According to product rules, the primary conditions for auto-assignment are:
 * - User must have the 'livechat-agent' role.
 * - Livechat service status (`statusLivechat`) must be 'available'.
 * - User's global status must NOT be 'offline' (Bots are exempt from this rule).
 * - If the "Accept new omnichannel requests when the agent is idle" (aka `Livechat_enabled_when_agent_idle`) setting is OFF,
 * then the statusConnection must NOT be 'away'.
 */
export const queryStatusAgentOnline = (extraFilters = {}, isLivechatEnabledWhenAgentIdle?: boolean): Filter<IUser> => ({
	statusLivechat: 'available',
	roles: 'livechat-agent',
	// ignore deactivated users
	active: true,
	$or: [
		{ roles: 'bot' },
		{
			status: {
				$exists: true,
				$ne: UserStatus.OFFLINE,
			},
		},
	],
	...extraFilters,
	...(isLivechatEnabledWhenAgentIdle === false && {
		statusConnection: { $ne: 'away' },
	}),
});

export const queryAvailableAgentsForSelection = (extraFilters = {}, isLivechatEnabledWhenAgentIdle?: boolean): Filter<IUser> => ({
	...queryStatusAgentOnline(extraFilters, isLivechatEnabledWhenAgentIdle),
	$and: [
		{
			$or: [{ agentLocked: { $exists: false } }, { agentLockedAt: { $lt: new Date(Date.now() - 5000) } }],
		},
	],
});
