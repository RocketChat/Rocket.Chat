import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useCallback, Fragment, useSyncExternalStore, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UserAction, USER_ACTIVITIES } from '../../../../../app/ui/client/lib/UserAction';

const maxUsernames = 5;

const ACTION_PRIORITY: Record<string, number> = {
	[USER_ACTIVITIES.USER_RECORDING]: 0,
	[USER_ACTIVITIES.USER_UPLOADING]: 1,
	[USER_ACTIVITIES.USER_TYPING]: 2,
	[USER_ACTIVITIES.USER_PLAYING]: 3,
};

const ComposerUserActionIndicator = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement => {
	const { t } = useTranslation();
	const roomAction = useSyncExternalStore(
		UserAction.subscribe,
		useCallback(() => UserAction.get(tmid || rid), [rid, tmid]),
	);
	const actions = useMemo(() => {
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
			.filter(Boolean) as {
			action: 'typing' | 'recording' | 'uploading' | 'playing';
			users: string[];
		}[];
	}, [roomAction]);

	return (
		<Box
			role='status'
			h='x20'
			className='rc-message-box__activity-wrapper'
			fontScale='c1'
			color='annotation'
			display='flex'
			alignItems='center'
		>
			{actions.map(({ action, users }, index) => (
				<Fragment key={action}>
					{index > 0 && ', '}
					{users.length < maxUsernames
						? users.join(', ')
						: `${users.slice(0, maxUsernames - 1).join(', ')} ${t('and')} ${t('others')}`}{' '}
					{users.length > 1 ? t(`are_${action}`) : t(`is_${action}`)}
				</Fragment>
			))}
		</Box>
	);
};

export default ComposerUserActionIndicator;
