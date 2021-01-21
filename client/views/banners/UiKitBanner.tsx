/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import { UiKitBanner as renderUiKitBannerBlocks } from '@rocket.chat/fuselage-ui-kit';
import React, { FC, useMemo } from 'react';

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

	return <Banner
		closeable
		icon={icon}
		inline={payload.inline}
		title={payload.title}
		variant={payload.variant}
		onClose={onClose}
	>
		{renderUiKitBannerBlocks(payload.blocks, { engine: 'rocket.chat' })}
	</Banner>;
};

export default UiKitBanner;
