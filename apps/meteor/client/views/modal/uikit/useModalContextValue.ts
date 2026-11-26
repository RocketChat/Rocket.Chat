import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext, UiKitViewState } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useMemo } from 'react';
import type { ContextType } from 'react';

import { useUiKitActionManager } from '../../../hooks/uikit/useUiKitActionManager';
import { useUiKitFileUpload } from '../../../hooks/uikit/useUiKitFileUpload';

type UseModalContextValueParams = {
	view: UiKit.ModalView;
	viewState: UiKitViewState;
	errors?: { [field: string]: string }[] | { [field: string]: string };
	rid?: string;
};

type UseModalContextValueReturn = ContextType<typeof UiKitContext>;

export const useModalContextValue = ({ view, viewState, errors, rid }: UseModalContextValueParams): UseModalContextValueReturn => {
	const actionManager = useUiKitActionManager();

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);
	const fileUpload = useUiKitFileUpload(rid);

	return {
		action: async ({ actionId, viewId, appId, dispatchActionConfig, blockId, value }) => {
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
		suggest: async ({ appId, actionId, blockId, value, viewId }) => {
			if (!viewId) {
				return {};
			}

			return actionManager.suggestOptions(appId, {
				type: 'blockSuggestion',
				actionId,
				blockId,
				appId,
				value,
				container: {
					type: 'view',
					id: viewId,
				},
				viewId,
				rid,
			});
		},
		...view,
		...fileUpload,
		errors,
		viewState,
		viewId: view.id,
		rid,
	};
};
