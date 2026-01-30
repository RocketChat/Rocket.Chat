import { useRouteParameter, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useCallback, useSyncExternalStore } from 'react';

import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';

export const useAppsContextualBar = () => {
	const context = useRouteParameter('context');
	const actionManager = useUiKitActionManager();
	const tab = useRouteParameter('tab');
	const { closeTab } = useRoomToolbox();

	const getSnapshot = useCallback(() => {
		if (tab !== 'app' || !context) {
			return undefined;
		}

		return actionManager.getInteractionPayloadByViewId(context)?.view;
	}, [actionManager, context, tab]);

	const subscribe = useCallback(
		(handler: () => void) => {
			if (tab !== 'app' || !context) {
				return () => undefined;
			}

			const view = actionManager.getInteractionPayloadByViewId(context)?.view;

			if (!view) {
				closeTab();
				return () => undefined;
			}

			actionManager.on(context, handler);

			return () => actionManager.off(context, handler);
		},
		[actionManager, closeTab, tab, context],
	);

	const view = useSyncExternalStore(subscribe, getSnapshot);

	return view;
};
