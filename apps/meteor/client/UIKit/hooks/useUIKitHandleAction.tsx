import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
// import { Banner, Icon } from '@rocket.chat/fuselage';
// import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
// import React, { Context, FC, useMemo } from 'react';
import type { UiKitPayload, UIKitActionEvent } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
// import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';

// import { useEndpoint } from '@rocket.chat/ui-contexts';

const useUIKitHandleAction = <S extends UiKitPayload>(state: S): ((event: UIKitActionEvent) => Promise<void>) => {
	const actionManager = useUiKitActionManager();
	return useMutableCallback(async ({ blockId, value, appId, actionId }) => {
		if (!appId) {
			throw new Error('useUIKitHandleAction - invalid appId');
		}
		return actionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: state.viewId || state.appId,
			},
			actionId,
			appId,
			value,
			blockId,
		});
	});
};

export { useUIKitHandleAction };
