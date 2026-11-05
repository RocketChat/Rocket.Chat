import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserActivity } from './useUserActivities';

const maxUsernames = 5;

type UserActivityTextProps = { activities: UserActivity[] };

const UserActivityText = ({ activities }: UserActivityTextProps) => {
	const { t } = useTranslation();

	return (
		<>
			{activities.map(({ action, users }, index) => {
				const shownUsers = users.length <= maxUsernames ? users : users.slice(0, maxUsernames - 1);
				const hiddenUsersCount = users.length - shownUsers.length;
				// The verb agrees with the listed subject (one person, two, or several), not with the total number of users
				const subjectCount = Math.min(users.length, 3);

				return (
					<Fragment key={action}>
						{index > 0 && ', '}
						{t('User_activity', {
							context: action,
							count: subjectCount,
							users: hiddenUsersCount ? [...shownUsers, t('User_activity_hidden_users', { count: hiddenUsersCount })] : shownUsers,
						})}
					</Fragment>
				);
			})}
		</>
	);
};

export default UserActivityText;
