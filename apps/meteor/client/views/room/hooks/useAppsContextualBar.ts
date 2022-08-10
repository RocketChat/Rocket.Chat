import { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { useCurrentRoute } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import { getUserInteractionPayloadByViewId } from '../../../../app/ui-message/client/ActionManager';
import { useRoom } from '../contexts/RoomContext';

type AppsContextualBarData = {
	viewId: string;
	roomId: string;
	payload: IUIKitContextualBarInteraction;
	appId: string;
};

export const useAppsContextualBar = (): AppsContextualBarData | undefined => {
	const [, params] = useCurrentRoute();
	const [payload, setPayload] = useState<IUIKitContextualBarInteraction>();
	const [appId, setAppId] = useState<string>();

	const { _id: roomId } = useRoom();

	const viewId = params?.context;

	useEffect(() => {
		if (viewId) {
			setPayload(getUserInteractionPayloadByViewId(viewId) as IUIKitContextualBarInteraction);
		}

		if (payload?.appId) {
			setAppId(payload.appId);
		}

		return (): void => {
			setPayload(undefined);
			setAppId(undefined);
		};
	}, [viewId, payload?.appId]);

	if (viewId && payload && appId) {
		return {
			viewId,
			roomId,
			payload,
			appId,
		};
	}

	return undefined;
};
