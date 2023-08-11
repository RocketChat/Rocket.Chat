import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { type UIKitUserInteractionResult, type UiKitBannerPayload, type UiKitPayload, isErrorType } from '@rocket.chat/core-typings';
import { useSafely, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { useEffect, type ContextType, useState } from 'react';

import { useUiKitActionManager } from '../../hooks/useUiKitActionManager';
import * as banners from '../../lib/banners';

type UseBannerContextValueReturn = ContextType<typeof UiKitContext> & {
	payload: UiKitBannerPayload;
};

export const useBannerContextValue = (payload: UiKitPayload): UseBannerContextValueReturn => {
	const [state, setState] = useSafely(useState(payload));
	const actionManager = useUiKitActionManager();
	const { viewId } = payload;

	const action = useMutableCallback(async ({ blockId, value, appId, actionId }) => {
		if (!appId) {
			throw new Error('useUIKitHandleAction - invalid appId');
		}
		return actionManager.triggerBlockAction({
			container: {
				type: UIKitIncomingInteractionContainerType.VIEW,
				id: state.viewId || state.appId,
			},
			actionId,
			appId,
			value,
			blockId,
		});
	});

	useEffect(() => {
		const handleUpdate = ({ ...data }: UIKitUserInteractionResult): void => {
			if (isErrorType(data)) {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
				return;
			}

			const { type, ...rest } = data;
			setState(rest as any);
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, setState, viewId]);

	return {
		action: async (event): Promise<void> => {
			if (!event.viewId) {
				return;
			}

			await action(event);
			banners.closeById(state.viewId);
		},
		payload: state,
	};
};
