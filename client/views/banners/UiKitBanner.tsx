/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import { kitContext, UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import React, { Context, FC, useMemo } from 'react';

import { IBanner } from '../../../definition/IBanner';

type UiKitBannerProps = {
	payload: IBanner['view'];
	onClose: () => void;
};

const UiKitBanner: FC<UiKitBannerProps> = ({ payload, onClose }) => {
	const icon = useMemo(() => {
		if (payload.icon) {
			return <Icon name={payload.icon} size={20} />;
		}

		return null;
	}, [payload.icon]);

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
		onClose={onClose}
	>
		<kitContext.Provider value={contextValue}>
			{renderUiKitBannerBlocks(payload.blocks, { engine: 'rocket.chat' })}
		</kitContext.Provider>
	</Banner>;
};

export default UiKitBanner;
