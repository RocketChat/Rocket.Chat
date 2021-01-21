import React, { FC, useCallback } from 'react';
import { useSubscription } from 'use-subscription';

import * as banners from '../../lib/banners';
import LegacyBanner from './LegacyBanner';
import UiKitBanner from './UiKitBanner';

const BannerRegion: FC = () => {
	const payload = useSubscription(banners.firstSubscription);

	const handleAction = useCallback(() => {
		if (!payload) {
			return;
		}

		if (!banners.isLegacyPayload(payload)) {
			return;
		}

		payload.action?.call(undefined);
	}, [payload]);

	const handleClose = useCallback(() => {
		if (!payload) {
			return;
		}

		if (banners.isLegacyPayload(payload)) {
			payload.onClose?.call(undefined);
		}

		banners.close();
	}, [payload]);

	if (!payload) {
		return null;
	}

	if (banners.isLegacyPayload(payload)) {
		return <LegacyBanner config={payload} onAction={handleAction} onClose={handleClose} />;
	}

	return <UiKitBanner payload={payload} onClose={handleClose} />;
};

export default BannerRegion;
