import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, Fragment } from 'react';

import { UserAction } from '../../../../../app/ui/client/lib/UserAction';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

const maxUsernames = 5;

const ComposerUserActionIndicator = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement => {
	const t = useTranslation();
	const actions = useReactiveValue(
		useCallback(() => {
			const roomAction = UserAction.get(tmid || rid) || {};

			const activities = Object.entries(roomAction);

			return activities
				.map(([key, _users]) => {
					const action = key.split('-')[1];

					const users = Object.keys(_users);
					if (users.length === 0) {
						return;
					}

					return {
						action,
						users,
					};
				})
				.filter(Boolean) as {
				action: 'typing' | 'recording' | 'uploading' | 'playing';
				users: string[];
			}[];
		}, [rid, tmid]),
	);
	return (
		<Box h='24px' className='rc-message-box__activity-wrapper' fontScale='p2' color='annotation' aria-live='polite'>
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
