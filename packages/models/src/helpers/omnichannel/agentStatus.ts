import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

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
