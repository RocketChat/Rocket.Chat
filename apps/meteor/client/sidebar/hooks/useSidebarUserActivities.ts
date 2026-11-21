import type { IRoom } from '@rocket.chat/core-typings';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useUserActivities } from '../../components/UserActivity';
import { UserAction } from '../../lib/UserAction';

export const useSidebarUserActivities = (rid: IRoom['_id'], enabled: boolean) => {
	const { sidebar } = useLayout();
	const isSidebarHidden = sidebar.shouldToggle && sidebar.isCollapsed;
	const shouldStream = enabled && !isSidebarHidden;

	useEffect(() => {
		if (!shouldStream) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, shouldStream]);

	return useUserActivities(rid);
};
