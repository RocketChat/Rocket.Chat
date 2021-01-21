import React, { FC, useCallback } from 'react';
import { useSubscription } from 'use-subscription';

import * as banners from '../../lib/banners';
import GenericBanner from './GenericBanner';

const BannerRegion: FC = () => {
	const payload = useSubscription(banners.subscription);

	const handleAction = useCallback(() => {
		if (payload?.action) {
			payload.action?.call(undefined);
		}
	}, [payload]);

	const handleClose = useCallback(() => {
		if (payload?.onClose) {
			payload.onClose?.call(undefined);
		}
		banners.close();
	}, [payload]);

	return <>
		{payload && <GenericBanner config={payload} onAction={handleAction} onClose={handleClose} />}
	</>;
};

export default BannerRegion;
