import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { Dispatch } from 'react';
import { useMemo, type ContextType } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';

type UseModalContextValueParams = {
	view: UiKit.ModalView;
	values: {
		[actionId: string]: {
			value: unknown;
			blockId?: string | undefined;
		};
	};
	updateValues: Dispatch<{
		actionId: string;
		payload: {
			value: unknown;
			blockId?: string;
		};
	}>;
};

type UseModalContextValueReturn = ContextType<typeof UiKitContext>;

export const useModalContextValue = ({ view, values, updateValues }: UseModalContextValueParams): UseModalContextValueReturn => {
	const actionManager = useUiKitActionManager();

	const emitInteraction = useMemo(() => actionManager.emitInteraction.bind(actionManager), [actionManager]);
	const debouncedEmitInteraction = useDebouncedCallback(emitInteraction, 700);

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
		updateState: ({ actionId, value, /* ,appId, */ blockId = 'default' }) => {
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
};
