import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useSyncExternalStore } from 'react';

import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';

export const useAppsContextualBar = () => {
	const viewId = useRouteParameter('context');
	const actionManager = useUiKitActionManager();
	const tab = useRouteParameter('tab');
	const { closeTab } = useRoomToolbox();

	const getSnapshot = useCallback(() => {
		if (!viewId) {
			return undefined;
		}

		return actionManager.getInteractionPayloadByViewId(viewId)?.view;
	}, [actionManager, viewId]);

	const subscribe = useCallback(
		(handler: () => void) => {
			if (!viewId) {
				return () => undefined;
			}

			if (!actionManager.getInteractionPayloadByViewId(viewId)?.view && tab === 'app') {
				closeTab();
			}

			actionManager.on(viewId, handler);

			return () => actionManager.off(viewId, handler);
		},
		[actionManager, closeTab, tab, viewId],
	);

	const view = useSyncExternalStore(subscribe, getSnapshot);

	return view;
};
