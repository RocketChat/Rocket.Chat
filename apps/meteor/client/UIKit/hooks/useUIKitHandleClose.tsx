import { UIKitInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
/* eslint-disable new-cap */
// import { Banner, Icon } from '@rocket.chat/fuselage';
// import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
// import React, { Context, FC, useMemo } from 'react';
import { UiKitPayload } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
// import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';

// import { useEndpoint } from '@rocket.chat/ui-contexts';

import * as ActionManager from '../../../app/ui-message/client/ActionManager';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyFn = (_error: any, _result: UIKitInteractionType | void): void => undefined;

const useUIKitHandleClose = <S extends UiKitPayload>(state: S, fn = emptyFn): (() => Promise<void | UIKitInteractionType>) => {
	const dispatchToastMessage = useToastMessageDispatch();
	return useMutableCallback(() =>
		ActionManager.triggerCancel({
			appId: state.appId,
			viewId: state.viewId,
			view: {
				...state,
				id: state.viewId,
				// state: groupStateByBlockId(values),
			},
			isCleared: true,
		})
			.then((result) => fn(undefined, result))
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
				fn(error, undefined);
				return Promise.reject(error);
			}),
	);
};

export { useUIKitHandleClose };
