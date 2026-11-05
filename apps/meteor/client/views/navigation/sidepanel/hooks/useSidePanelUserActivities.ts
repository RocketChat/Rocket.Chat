import type { IRoom } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { useUserActivities } from '../../../../components/UserActivity';
import { UserAction } from '../../../../lib/UserAction';
import { useIsSidePanelHidden } from '../../hooks/useIsSidePanelHidden';

export const useSidePanelUserActivities = (rid: IRoom['_id']) => {
	const isSidePanelHidden = useIsSidePanelHidden();

	useEffect(() => {
		if (isSidePanelHidden) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, isSidePanelHidden]);

	return useUserActivities(rid);
};
