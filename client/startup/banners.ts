import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import * as banners from '../lib/banners';
import { APIClient } from '../../app/utils/client';
import { IBanner, BannerPlatform } from '../../definition/IBanner';
import { Notifications } from '../../app/notifications/client';

const fetchInitialBanners = async (): Promise<void> => {
	const response = await APIClient.get('v1/banners.getNew', {
		platform: BannerPlatform.Web,
	}) as {
		banners: IBanner[];
	};

	for (const banner of response.banners) {
		banners.open({
			...banner.view,
			viewId: banner.view.viewId || banner._id,
		});
	}
};

const handleNewBanner = async (event: { bannerId: string }): Promise<void> => {
	const response = await APIClient.get('v1/banners.getNew', {
		platform: BannerPlatform.Web,
		bid: event.bannerId,
	}) as {
		banners: IBanner[];
	};

	for (const banner of response.banners) {
		banners.open({
			...banner.view,
			viewId: banner.view.viewId || banner._id,
		});
	}
};

const watchBanners = (): (() => void) => {
	fetchInitialBanners();

	Notifications.onLogged('new-banner', handleNewBanner);

	return (): void => {
		Notifications.unLogged(handleNewBanner);
		banners.clear();
	};
};

Meteor.startup(() => {
	let unwatchBanners: () => void | undefined;

	Tracker.autorun(() => {
		unwatchBanners?.();

		if (!Meteor.userId()) {
			return;
		}

		unwatchBanners = Tracker.nonreactive(watchBanners);
	});
});
