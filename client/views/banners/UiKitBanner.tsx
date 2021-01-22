/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import React, { Context, FC, useMemo, useEffect, useState } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';

import * as banners from '../../lib/banners';
// import { useEndpoint } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import * as ActionManager from '../../../app/ui-message/client/ActionManager';
import { isErrorType, UIKitUserInteractionResult, UiKitBannerProps, UiKitBannerPayload } from '../../../definition/UIKit';

const useActionManagerState = (initialState: UiKitBannerPayload): UiKitBannerPayload => {
	const [state, setState] = useState(initialState);

	const { viewId } = state;

	useEffect(() => {
		const handleUpdate = ({ ...data }: UIKitUserInteractionResult): void => {
			if (isErrorType(data)) {
				const { errors } = data;
				setState((state) => ({ ...state, errors }));
				return;
			}
			setState(data);
		};

		ActionManager.on(viewId, handleUpdate);

		return (): void => {
			ActionManager.off(viewId, handleUpdate);
		};
	}, [viewId]);

	return state;
};

const UiKitBanner: FC<UiKitBannerProps> = ({ payload }) => {
	const state = useActionManagerState(payload);

	const icon = useMemo(() => {
		if (state.icon) {
			return <Icon name={state.icon} size={20} />;
		}

		return null;
	}, [state.icon]);

	const dispatchToastMessage = useToastMessageDispatch();

	const handleClose = useMutableCallback(async () => {
		try {
			await ActionManager.triggerCancel({
				appId: state.appId,
				viewId: state.viewId,
				view: {
					...state,
					id: state.viewId,
					// state: groupStateByBlockId(values),
				},
				isCleared: true,
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			banners.close();
		}
	});

	const contextValue = useMemo<typeof kitContext extends Context<infer V> ? V : never>(() => ({
		action: async ({ blockId, value, appId, actionId }): Promise<void> => {
			ActionManager.triggerBlockAction({
				container: {
					type: UIKitIncomingInteractionContainerType.VIEW,
					id: state.appId,
				},
				actionId,
				appId,
				value,
				blockId,
			});
		},
		appId: state.appId,
	}), [state.appId]);

	return <Banner
		closeable
		icon={icon}
		inline={state.inline}
		title={state.title}
		variant={state.variant}
		onClose={handleClose}
	>
		<kitContext.Provider value={contextValue}>
			{renderUiKitBannerBlocks(state.blocks, { engine: 'rocket.chat' })}
		</kitContext.Provider>
	</Banner>;
};

export default UiKitBanner;
