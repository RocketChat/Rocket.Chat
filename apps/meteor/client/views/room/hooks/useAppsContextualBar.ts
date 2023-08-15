import type { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../../hooks/useUiKitActionManager';
import { useRoom } from '../contexts/RoomContext';

type AppsContextualBarData = {
	viewId: string;
	rid: string;
	payload: IUIKitContextualBarInteraction;
	appId: string;
};

export const useAppsContextualBar = (): AppsContextualBarData | undefined => {
	const [payload, setPayload] = useState<IUIKitContextualBarInteraction>();
	const actionManager = useUiKitActionManager();
	const [appId, setAppId] = useState<string>();

	const { _id: rid } = useRoom();

	const viewId = useRouteParameter('context');

	useEffect(() => {
		if (viewId) {
			setPayload(actionManager.getUserInteractionPayloadByViewId(viewId) as IUIKitContextualBarInteraction);
		}

		if (payload?.appId) {
			setAppId(payload.appId);
		}

		return (): void => {
			setPayload(undefined);
			setAppId(undefined);
		};
	}, [viewId, payload?.appId, actionManager]);

	if (viewId && payload && appId) {
		return {
			viewId,
			rid,
			payload,
			appId,
		};
	}

	return undefined;
};
