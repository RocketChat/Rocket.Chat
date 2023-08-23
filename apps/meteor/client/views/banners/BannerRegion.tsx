import type { ReactElement } from 'react';
import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import * as banners from '../../lib/banners';
import LegacyBanner from './LegacyBanner';
import UiKitBanner from './UiKitBanner';
import { useRemoteBanners } from './hooks/useRemoteBanners';
import { useUserBanners } from './hooks/useUserBanners';

const BannerRegion = (): ReactElement | null => {
	const payload = useSyncExternalStore(...banners.firstSubscription);

	useRemoteBanners();
	useUserBanners();

	if (!payload) {
		return null;
	}

	if (banners.isLegacyPayload(payload)) {
		return <LegacyBanner config={payload} />;
	}

	return <UiKitBanner payload={payload} />;
};

export default BannerRegion;
