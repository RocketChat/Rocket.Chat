import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

export const queryStatusAgentOnline = (extraFilters = {}, isLivechatEnabledWhenAgentIdle?: boolean): Filter<IUser> => ({
	statusLivechat: 'available',
	roles: 'livechat-agent',
	// ignore deactivated users
	active: true,
	...(!isLivechatEnabledWhenAgentIdle && {
		$or: [
			{
				status: {
					$exists: true,
					$ne: UserStatus.OFFLINE,
				},
				roles: {
					$ne: 'bot',
				},
			},
			{
				roles: 'bot',
			},
		],
	}),
	...extraFilters,
	...(isLivechatEnabledWhenAgentIdle === false && {
		statusConnection: { $ne: 'away' },
	}),
});
