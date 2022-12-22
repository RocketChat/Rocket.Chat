import type { FC } from 'react';
import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import * as banners from '../../lib/banners';
import LegacyBanner from './LegacyBanner';
import UiKitBanner from './UiKitBanner';

const BannerRegion: FC = () => {
	const payload = useSyncExternalStore(...banners.firstSubscription);

	if (!payload) {
		return null;
	}

	if (banners.isLegacyPayload(payload)) {
		return <LegacyBanner config={payload} />;
	}

	return <UiKitBanner payload={payload} />;
};

export default BannerRegion;
