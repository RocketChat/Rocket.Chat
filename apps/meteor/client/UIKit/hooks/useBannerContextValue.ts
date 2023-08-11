import type { UIKitActionEvent, UiKitPayload } from '@rocket.chat/core-typings';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import * as banners from '../../lib/banners';
import { useUIKitHandleAction } from './useUIKitHandleAction';
import { useUIKitStateManager } from './useUIKitStateManager';

type VariantType = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type StateType = { title?: string; inline?: boolean; variant?: VariantType } & UiKitPayload;

export const useBannerContextValue = (payload: UiKitPayload): ContextType<typeof UiKitContext> => {
	const state = useUIKitStateManager<StateType>(payload);
	const action = useUIKitHandleAction(state);

	return {
		action: async (event): Promise<void> => {
			if (!event.viewId) {
				return;
			}

			await action(event as UIKitActionEvent);
			banners.closeById(state.viewId);
		},
		state,
	};
};
