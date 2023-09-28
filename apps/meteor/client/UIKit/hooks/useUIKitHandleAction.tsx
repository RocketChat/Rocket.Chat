import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { UiKitPayload, UIKitActionEvent } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

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
