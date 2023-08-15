import type { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

type ActionParams = {
	viewId: string;
	rid: string;
	payload: IUIKitContextualBarInteraction;
	appId: string;
};

type useContextualBarContextValueProps = ActionParams & {
	values: any;
	updateValues: (value: any) => void;
};

export const useContextualBarContextValue = (props: useContextualBarContextValueProps): ContextType<typeof UiKitContext> => {
	const actionManager = useUiKitActionManager();

	const { rid, viewId, updateValues } = props;

	const debouncedBlockAction = useDebouncedCallback(({ actionId, appId, value, blockId }) => {
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
		action: ({ actionId, appId, value, blockId, dispatchActionConfig }) => {
			if (Array.isArray(dispatchActionConfig) && dispatchActionConfig.includes('on_character_entered')) {
				debouncedBlockAction({ actionId, appId, value, blockId });
			} else {
				actionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					rid,
					value,
					blockId,
				});
			}
		},
		updateState: ({ actionId, value, blockId = 'default' }: { actionId: string; value: any; blockId: string }) => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...props,
	};
};
