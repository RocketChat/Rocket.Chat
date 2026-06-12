import { useSyncExternalStore } from 'react';

import LegacyBanner from './LegacyBanner';
import UiKitBanner from './UiKitBanner';
import { useUserBanners } from './hooks/useUserBanners';
import { withErrorBoundary } from '../../components/withErrorBoundary';
import * as banners from '../../lib/banners';

const BannerRegion = () => {
	const payload = useSyncExternalStore(...banners.firstSubscription);

	useUserBanners();

	if (!payload) {
		return null;
	}

	if (banners.isLegacyPayload(payload)) {
		return <LegacyBanner config={payload} />;
	}

	return <UiKitBanner key={payload.viewId} initialView={payload} />;
};

export default withErrorBoundary(BannerRegion);
