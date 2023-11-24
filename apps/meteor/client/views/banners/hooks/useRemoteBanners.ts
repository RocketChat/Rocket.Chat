import { BannerPlatform } from '@rocket.chat/core-typings';
import type { IBanner, Serialized, UiKit } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId, ServerContext } from '@rocket.chat/ui-contexts';
import { useContext, useEffect } from 'react';

import * as banners from '../../../lib/banners';
import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';

export const useRemoteBanners = () => {
	const uid = useUserId();

	const serverContext = useContext(ServerContext);
	const getBanners = useEndpoint('GET', '/v1/banners');
	const subscribeToNotifyLoggedIn = useStream('notify-logged');
	const subscribeToNotifyUser = useStream('notify-user');

	const actionManager = useUiKitActionManager();

	useEffect(() => {
		if (!uid) {
			return;
		}

		const controller = new AbortController();

		const { signal } = controller;

		const mapBanner = (banner: Serialized<IBanner>): UiKit.BannerView => ({
			...banner.view,
			viewId: banner.view.viewId || banner._id,
		});

		const fetchInitialBanners = async (): Promise<void> => {
			const response = await getBanners({
				platform: BannerPlatform.Web,
			});

			if (signal?.aborted) {
				return;
			}

			response.banners.forEach((banner) => {
				actionManager.openView('banner', mapBanner(banner));
			});
		};

		fetchInitialBanners();

		const unsubscribeFromBannerChanged = subscribeToNotifyLoggedIn('banner-changed', async (event): Promise<void> => {
			const response = await serverContext.callEndpoint({
				method: 'GET',
				pathPattern: '/v1/banners/:id',
				keys: { id: event.bannerId },
				params: { platform: BannerPlatform.Web },
			});

			if (signal?.aborted) {
				return;
			}

			if (!response.banners.length) {
				actionManager.disposeView(event.bannerId);
				return;
			}

			response.banners.forEach((banner) => {
				actionManager.openView('banner', mapBanner(banner));
			});
		});

		const unsubscribeBanners = subscribeToNotifyUser(`${uid}/banners`, async (banner) => {
			actionManager.openView('banner', banner.view);
		});

		return () => {
			controller.abort();

			unsubscribeFromBannerChanged();
			unsubscribeBanners();

			banners.clear();
		};
	}, [getBanners, serverContext, subscribeToNotifyLoggedIn, uid, subscribeToNotifyUser, actionManager]);
};
