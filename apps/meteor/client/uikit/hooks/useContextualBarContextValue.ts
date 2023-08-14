import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { IRoom } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';

type ActionParams = {
	viewId: string;
	type: 'errors' | string;
	appId: string;
	errors: Record<string, string>;
	view: IUIKitSurface;
};

type useContextualBarContextValueProps = ActionParams & {
	roomId: IRoom['_id'];
	values: any;
	updateValues: (value: any) => void;
};

export const useContextualBarContextValue = (props: useContextualBarContextValueProps): ContextType<typeof UiKitContext> => {
	const actionManager = useUiKitActionManager();

	const { roomId, viewId, updateValues } = props;

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
					rid: roomId,
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
