import { Promise } from 'meteor/promise';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../api';
import { Banner } from '../../../../server/sdk';
import { BannerPlatform } from '../../../../definition/IBanner';

API.v1.addRoute('banners.getNew', { authRequired: true }, {
	get() {
		check(this.queryParams, Match.ObjectIncluding({
			platform: String,
			bid: Match.Maybe(String),
		}));

		const { platform, bid: bannerId } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		if (!Object.values(BannerPlatform).includes(platform)) {
			throw new Meteor.Error('error-unknown-platform', 'Platform is unknown.');
		}

		const banners = Promise.await(Banner.getNewBannersForUser(this.userId, platform, bannerId));

		return API.v1.success({ banners });
	},
});

API.v1.addRoute('banners.dismiss', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			bannerId: String,
		}));

		const { bannerId } = this.bodyParams;

		if (!bannerId || !bannerId.trim()) {
			throw new Meteor.Error('error-missing-param', 'The required "bannerId" param is missing.');
		}

		try {
			Promise.await(Banner.dismiss(this.userId, bannerId));
			return API.v1.success();
		} catch (e) {
			return API.v1.failure();
		}
	},
});
