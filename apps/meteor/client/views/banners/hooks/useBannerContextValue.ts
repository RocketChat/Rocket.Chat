import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ContextType, Dispatch } from 'react';

import { useUiKitActionManager } from '../../../hooks/uikit/useUiKitActionManager';

type UseBannerContextValueParams = {
	view: UiKit.BannerView;
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
			blockId?: string | undefined;
		};
	}>;
};
type UseBannerContextValueReturn = ContextType<typeof UiKitContext>;

export const useBannerContextValue = ({ view, values, updateValues }: UseBannerContextValueParams): UseBannerContextValueReturn => {
	const actionManager = useUiKitActionManager();

	return {
		action: async ({ appId, viewId, actionId, blockId, value }) => {
			if (!appId || !viewId) {
				return;
			}

			await actionManager.emitInteraction(appId, {
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

			actionManager.disposeView(view.viewId);
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
		appId: view.appId,
		viewId: view.viewId,
		values,
	};
};
