import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
/* eslint-disable new-cap */
// import { Banner, Icon } from '@rocket.chat/fuselage';
// import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
// import React, { Context, FC, useMemo } from 'react';
import { UiKitPayload, UIKitActionEvent } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
// import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';

// import { useEndpoint } from '@rocket.chat/ui-contexts';
import * as ActionManager from '../../../app/ui-message/client/ActionManager';

const useUIKitHandleAction = <S extends UiKitPayload>(state: S): ((event: UIKitActionEvent) => Promise<void>) =>
	useMutableCallback(async ({ blockId, value, appId, actionId }) => {
		if (!appId) {
			throw new Error('useUIKitHandleAction - invalid appId');
		}
		return ActionManager.triggerBlockAction({
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

export { useUIKitHandleAction };
