import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import { type ContextType } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';

type UseBannerContextValueParams = {
	view: UiKit.BannerView;
	values: {
		[actionId: string]: {
			value: unknown;
			blockId?: string | undefined;
		};
	};
};
type UseBannerContextValueReturn = ContextType<typeof UiKitContext>;

export const useBannerContextValue = ({ view, values }: UseBannerContextValueParams): UseBannerContextValueReturn => {
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
		updateState: (): void => undefined,
		appId: view.appId,
		viewId: view.viewId,
		values,
	};
};
