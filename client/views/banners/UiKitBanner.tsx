/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import React, { Context, FC, useMemo } from 'react';

import * as banners from '../../lib/banners';
// import { useEndpoint } from '../../contexts/ServerContext';
import { UiKitBannerProps, UiKitBannerPayload } from '../../../definition/UIKit';
import { useUIKitStateManager } from '../../UIKit/hooks/useUIKitStateManager';
import { useUIKitHandleClose } from '../../UIKit/hooks/useUIKitHandleClose';
import { useUIKitHandleAction } from '../../UIKit/hooks/useUIKitHandleAction';

const UiKitBanner: FC<UiKitBannerProps> = ({ payload }) => {
	const state = useUIKitStateManager<UiKitBannerPayload>(payload);

	const icon = useMemo(() => {
		if (state.icon) {
			return <Icon name={state.icon} size={20} />;
		}

		return null;
	}, [state.icon]);

	const handleClose = useUIKitHandleClose(state, () => banners.close());

	const action = useUIKitHandleAction(state);

	const contextValue = useMemo<typeof kitContext extends Context<infer V> ? V : never>(() => ({
		action: async (...args): Promise<void> => {
			await action(...args);
			banners.closeById(state.viewId);
		},
		state: (): void => undefined,
		appId: state.appId,
	}), [action, state.appId, state.viewId]);

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
