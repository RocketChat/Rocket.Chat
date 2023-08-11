import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import type { ActionManagerState } from '../../views/modal/uikit/hooks/useActionManagerState';

export const useContextualBarContextValue = (
	state: ActionManagerState,
	{ values, updateValues }: { values: any; updateValues: (value: any) => void },
): ContextType<typeof UiKitContext> => {
	const actionManager = useUiKitActionManager();

	const { viewId } = state;

	const debouncedBlockAction = useDebouncedCallback(({ actionId, appId, value, blockId }: ActionParams) => {
		actionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: viewId,
			},
			actionId,
			appId,
			value,
			blockId,
		});
	}, 700);

	return {
		action: async ({ actionId, appId, value, blockId, dispatchActionConfig }: ActionParams): Promise<void> => {
			if (Array.isArray(dispatchActionConfig) && dispatchActionConfig.includes(InputElementDispatchAction.ON_CHARACTER_ENTERED)) {
				await debouncedBlockAction({ actionId, appId, value, blockId });
			} else {
				await actionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					rid: roomId,
					value,
					blockId,
				});
			}
		},
		state: ({ actionId, value, blockId = 'default' }: ActionParams): void => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...state,
		values,
	};
};
