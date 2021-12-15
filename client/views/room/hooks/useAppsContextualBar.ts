import { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';

import { getUserInteractionPayloadByViewId } from '../../../../app/ui-message/client/ActionManager';
import { useCurrentRoute } from '../../../contexts/RouterContext';

type AppsContextualBarData = {
	viewId: string;
	payload: IUIKitContextualBarInteraction | {};
};

export const useAppsContextualBar = (): AppsContextualBarData => {
	const [, params] = useCurrentRoute();

	const viewId = params?.context;

	const data = {
		viewId: viewId || '',
		payload: {},
	};

	if (viewId) {
		data.payload = getUserInteractionPayloadByViewId(viewId);
	}

	return data;
};
