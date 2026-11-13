import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitComponent, UiKitContext, UiKitHome as UiKitHomeSurfaceRender } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useMemo } from 'react';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../hooks/uikit/useUiKitActionManager';
import { useUiKitView } from '../../hooks/uikit/useUiKitView';

export type UiKitHomeProps = {
	key: UiKit.HomeView['id']; // force re-mount when viewId changes
	initialView: UiKit.HomeView;
};

const UiKitHome = ({ initialView }: UiKitHomeProps) => {
	const actionManager = useUiKitActionManager();
	const { view, values, updateValues } = useUiKitView(initialView);

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

	const contextValue: ContextType<typeof UiKitContext> = {
		action: async ({ appId, viewId, actionId, dispatchActionConfig, blockId, value }): Promise<void> => {
			if (!appId || !viewId) {
				return;
			}

			const emit = dispatchActionConfig?.includes('on_character_entered') ? debouncedEmitInteraction : emitInteraction;

			await emit(appId, {
				type: 'blockAction',
				actionId,
				container: {
					type: 'view',
					id: viewId,
				},
				payload: {
					blockId,
					value,
				},
			});
		},
		updateState: ({ actionId, value, blockId = 'default' }) => {
			updateValues({
				actionId,
				payload: {
					blockId,
					value,
				},
			});
		},
		...view,
		values,
		viewId: view.id,
	};

	return (
		<UiKitContext.Provider value={contextValue}>
			<UiKitComponent render={UiKitHomeSurfaceRender} blocks={view.blocks} />
		</UiKitContext.Provider>
	);
};

export default UiKitHome;
