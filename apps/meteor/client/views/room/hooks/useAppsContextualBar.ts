import { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { useCurrentRoute } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { getUserInteractionPayloadByViewId } from '../../../../app/ui-message/client/ActionManager';
import { App } from '../../admin/apps/types';
import { useRoom } from '../contexts/RoomContext';

type AppsContextualBarData = {
	viewId: string;
	roomId: string;
	payload: IUIKitContextualBarInteraction;
	appInfo: App;
};

export const useAppsContextualBar = (): AppsContextualBarData | undefined => {
	const [, params] = useCurrentRoute();
	const [payload, setPayload] = useState<IUIKitContextualBarInteraction>();
	const [appInfo, setAppInfo] = useState<App>();

	const { _id: roomId } = useRoom();

	const viewId = params?.context;

	useEffect(() => {
		if (viewId) {
			setPayload(getUserInteractionPayloadByViewId(viewId) as IUIKitContextualBarInteraction);
		}

		if (payload?.appId) {
			setAppInfo({ id: payload.appId } as any);
		}

		return (): void => {
			setPayload(undefined);
			setAppInfo(undefined);
		};
	}, [viewId, payload?.appId]);

	if (viewId && payload && appInfo) {
		return {
			viewId,
			roomId,
			payload,
			appInfo,
		};
	}

	return undefined;
};
