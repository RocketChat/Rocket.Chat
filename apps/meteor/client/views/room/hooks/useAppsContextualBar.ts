import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';

export const useAppsContextualBar = () => {
	const viewId = useRouteParameter('context');
	const actionManager = useUiKitActionManager();

	const view = useMemo(() => {
		if (viewId) {
			return actionManager.getUserInteractionPayloadByViewId(viewId);
		}

		return undefined;
	}, [actionManager, viewId]);

	return view;
};
