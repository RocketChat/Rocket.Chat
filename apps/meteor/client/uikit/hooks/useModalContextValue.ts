import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import type { ModalState } from '../../views/modal/uikit/UiKitModal';

type UseModalContextValueProps = ModalState & {
	values: any;
	updateValues: (value: any) => void;
};

export const useModalContextValue = (props: UseModalContextValueProps): ContextType<typeof UiKitContext> => {
	const actionManager = useUiKitActionManager();

	const { viewId, mid: _mid, values, updateValues } = props;

	const debouncedBlockAction = useDebouncedCallback((actionId, appId, value, blockId, mid) => {
		actionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: viewId,
			},
			actionId,
			appId,
			value,
			blockId,
			mid,
		});
	}, 700);

	return {
		action: ({ actionId, appId, value, blockId, mid = _mid, dispatchActionConfig }) => {
			if (Array.isArray(dispatchActionConfig) && dispatchActionConfig.includes('on_character_entered')) {
				debouncedBlockAction(actionId, appId, value, blockId, mid);
			} else {
				actionManager.triggerBlockAction({
					container: {
						type: UIKitIncomingInteractionContainerType.VIEW,
						id: viewId,
					},
					actionId,
					appId,
					value,
					blockId,
					mid,
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
		payload: props,
		values,
	};
};
