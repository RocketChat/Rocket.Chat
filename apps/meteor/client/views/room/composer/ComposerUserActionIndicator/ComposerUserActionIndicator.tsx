import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { Fragment, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { UserAction } from '../../../../../app/ui/client/lib/UserAction';
import './ComposerUserActionIndicator.css';

const maxUsernames = 5;
const MEDSENSE_LABEL = 'medsense';
type ActivityAction = 'typing' | 'recording' | 'uploading' | 'playing' | 'medsense-processing-form' | 'medsense-preparing-form';

const getActivityAction = (key: string): ActivityAction => {
	if (key === 'medsense-processing-form' || key === 'medsense-preparing-form') {
		return key;
	}

	return key.split('-')[1] as ActivityAction;
};

export const ComposerUserActionIndicator = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement | null => {
	const { t } = useTranslation();

	const roomAction = useSyncExternalStore(
		UserAction.subscribe,
		useCallback(() => UserAction.get(tmid || rid), [rid, tmid]),
	);

	const actions = useMemo(
		() =>
			Object.entries(roomAction ?? {})
				.map(([key, usersMap]) => {
					const action = getActivityAction(key);
					const users = Object.keys(usersMap || {});
					if (!users.length) {
						return;
					}

					return { action, users };
				})
				.filter(Boolean) as {
				action: ActivityAction;
				users: string[];
			}[],
		[roomAction],
	);

	const formatUsers = useCallback(
		(users: string[]) => {
			if (users.length < maxUsernames) {
				return users.join(', ');
			}

			return `${users.slice(0, maxUsernames - 1).join(', ')} ${t('and')} ${t('others')}`;
		},
		[t],
	);

	const activityPhrases = useMemo(() => {
		return actions.flatMap(({ action, users }) => {
			const normalizedUsers = users.map((user) => user.trim().toLowerCase());
			const hasMedsense = action === 'typing' && normalizedUsers.includes(MEDSENSE_LABEL);
			const nonMedsenseUsers = users.filter((user) => user.trim().toLowerCase() !== MEDSENSE_LABEL);

			const phrases: string[] = [];
			if (hasMedsense) {
				phrases.push('MedSense is thinking');
			}
			if (action === 'medsense-processing-form' && normalizedUsers.includes(MEDSENSE_LABEL)) {
				phrases.push('MedSense is processing form');
			}
			if (action === 'medsense-preparing-form' && normalizedUsers.includes(MEDSENSE_LABEL)) {
				phrases.push('MedSense is preparing form');
			}

			if (nonMedsenseUsers.length > 0 && !action.startsWith('medsense-')) {
				const userList = formatUsers(nonMedsenseUsers);
				phrases.push(`${userList} ${nonMedsenseUsers.length > 1 ? t(`are_${action}`) : t(`is_${action}`)}`);
			}

			if (!phrases.length && users.length > 0 && !action.startsWith('medsense-')) {
				const userList = formatUsers(users);
				phrases.push(`${userList} ${users.length > 1 ? t(`are_${action}`) : t(`is_${action}`)}`);
			}

			return phrases;
		});
	}, [actions, formatUsers, t]);

	if (!activityPhrases.length) {
		return null;
	}

	return (
		<Box className='rc-message-box__activity-wrapper rc-message-box__activity-wrapper--medsense' aria-live='polite'>
			<Box className='rc-message-box__activity-pill' fontScale='c1' color='annotation'>
				{activityPhrases.map((phrase, index) => (
					<Fragment key={`${phrase}-${index}`}>
						{index > 0 && ', '}
						{phrase}
					</Fragment>
				))}
			</Box>
		</Box>
	);
};

export default ComposerUserActionIndicator;
