import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';

export const useAppsContextualBar = () => {
	const viewId = useRouteParameter('context');
	const actionManager = useUiKitActionManager();

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

			actionManager.on(viewId, handler);

			return () => actionManager.off(viewId, handler);
		},
		[actionManager, viewId],
	);

	const view = useSyncExternalStore(subscribe, getSnapshot);

	return view;
};
