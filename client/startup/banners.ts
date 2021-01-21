import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import * as banners from '../lib/banners';
import { APIClient } from '../../app/utils/client';
import { IBanner, BannerPlatform } from '../../definition/IBanner';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			banners.close();
			return;
		}

		Tracker.nonreactive(async () => {
			const response = await APIClient.get('v1/banners.getNew', {
				platform: BannerPlatform.Web,
			}) as {
				banners: IBanner[];
			};

			for (const banner of response.banners) {
				banners.open(banner.view);
			}
		});
	});
});
