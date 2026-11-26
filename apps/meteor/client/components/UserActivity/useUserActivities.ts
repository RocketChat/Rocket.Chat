import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { UserAction, USER_ACTIVITIES } from '../../lib/UserAction';

const ACTION_PRIORITY: Record<string, number> = {
	[USER_ACTIVITIES.USER_RECORDING]: 0,
	[USER_ACTIVITIES.USER_UPLOADING]: 1,
	[USER_ACTIVITIES.USER_TYPING]: 2,
	[USER_ACTIVITIES.USER_PLAYING]: 3,
};

export type UserActivity = {
	action: 'typing' | 'recording' | 'uploading' | 'playing';
	users: string[];
};

export const useUserActivities = (rid: string, tmid?: string): UserActivity[] => {
	const roomAction = useSyncExternalStore(
		UserAction.subscribe,
		useCallback(() => UserAction.get(tmid || rid), [rid, tmid]),
	);

	return useMemo(() => {
		const usersRendered = new Set<string>();
		return Object.entries(roomAction ?? {})
			.sort(([a], [b]) => ACTION_PRIORITY[a] - ACTION_PRIORITY[b])
			.map(([key, _users]) => {
				const action = key.split('-')[1];

				const users = Object.keys(_users);
				if (users.length === 0) {
					return;
				}

				const filteredUsers = users.filter((user) => !usersRendered.has(user));

				if (filteredUsers.length === 0) {
					return;
				}

				for (const user of filteredUsers) {
					usersRendered.add(user);
				}

				return {
					action,
					users: filteredUsers,
				};
			})
			.filter(Boolean) as UserActivity[];
	}, [roomAction]);
};
