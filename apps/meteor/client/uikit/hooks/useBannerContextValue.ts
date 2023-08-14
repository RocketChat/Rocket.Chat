import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { type UIKitUserInteractionResult, type UiKitBannerPayload, type UiKitPayload, isErrorType } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
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
		action: async ({ actionId, appId, blockId, value, viewId }): Promise<void> => {
			if (!viewId) {
				return;
			}

			if (!appId) {
				throw new Error('useUIKitHandleAction - invalid appId');
			}

			actionManager.triggerBlockAction({
				container: {
					type: UIKitIncomingInteractionContainerType.VIEW,
					id: state.viewId || state.appId,
				},
				actionId,
				appId,
				value,
				blockId,
			});

			banners.closeById(state.viewId);
		},
		payload: state,
	};
};
