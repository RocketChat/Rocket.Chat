import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidebarRoomListGroup } from './useRoomList';
import { getActivityFilterLabel } from '../categories/hooks/useActivityFilterItems';

type PendingChoice = { groupKey: string; activityFilterHours: number | undefined };

/**
 * Words the outcome of choosing an activity filter for a status region. The menu closes and the list changes
 * without moving focus, so nothing else tells a screen reader user what happened. Only a choice made here is
 * announced, once the groups reflect it; a filter that changes on its own (another device, the license
 * arriving) stays quiet.
 */
export const useActivityFilterAnnouncement = (groups: SidebarRoomListGroup[]) => {
	const { t } = useTranslation();
	const [pending, setPending] = useState<PendingChoice>();
	const [announcement, setAnnouncement] = useState('');

	const announceActivityFilter = useCallback(
		(groupKey: string, activityFilterHours: number | undefined) => setPending({ groupKey, activityFilterHours }),
		[],
	);

	useEffect(() => {
		if (!pending) {
			return;
		}
		const group = groups.find(({ key }) => key === pending.groupKey);
		if (!group || group.activityFilterHours !== pending.activityFilterHours) {
			return;
		}
		setPending(undefined);
		const title = group.translateTitle ? t(group.title) : group.title;
		setAnnouncement(
			group.activityFilterHours
				? t('Inactive_rooms_hidden_in_group', {
						count: group.inactiveCount,
						group: title,
						filter: getActivityFilterLabel(t, group.activityFilterHours),
					})
				: t('Activity_filter_cleared_in_group', { group: title }),
		);
	}, [groups, pending, t]);

	return { announcement, announceActivityFilter };
};
