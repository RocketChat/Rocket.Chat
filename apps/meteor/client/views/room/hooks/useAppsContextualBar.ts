import { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { useCurrentRoute } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
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
		async function getAppData(appId: string): Promise<void> {
			const app = await Apps.getApp(appId);
			setAppInfo(app);
		}

		if (viewId) {
			setPayload(getUserInteractionPayloadByViewId(viewId) as IUIKitContextualBarInteraction);
		}

		if (payload?.appId) {
			getAppData(payload.appId);
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
