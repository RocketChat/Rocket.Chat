/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import React, { Context, FC, useCallback, useMemo } from 'react';

import * as banners from '../../lib/banners';
import { UiKitBannerPayload } from '../../lib/banners';
import { useEndpoint } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

type UiKitBannerProps = {
	payload: UiKitBannerPayload;
};

const UiKitBanner: FC<UiKitBannerProps> = ({ payload }) => {
	const icon = useMemo(() => {
		if (payload.icon) {
			return <Icon name={payload.icon} size={20} />;
		}

		return null;
	}, [payload.icon]);

	const dismissBanner = useEndpoint('POST', 'banners.dismiss');

	const dispatchToastMessage = useToastMessageDispatch();

	const handleClose = useCallback(async () => {
		try {
			await dismissBanner({ bannerId: payload._id });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			banners.close();
		}
	}, [dismissBanner, dispatchToastMessage, payload._id]);

	const contextValue = useMemo<typeof kitContext extends Context<infer V> ? V : never>(() => ({
		action: async (action): Promise<void> => {
			console.log(action);
		},
		appId: 'core',
	}), []);

	return <Banner
		closeable
		icon={icon}
		inline={payload.inline}
		title={payload.title}
		variant={payload.variant}
		onClose={handleClose}
	>
		<kitContext.Provider value={contextValue}>
			{renderUiKitBannerBlocks(payload.blocks, { engine: 'rocket.chat' })}
		</kitContext.Provider>
	</Banner>;
};

export default UiKitBanner;
