import { Promise } from 'meteor/promise';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { TextObjectType, BlockType } from '@rocket.chat/apps-engine/definition/uikit';

import { API } from '../api';
import { Banner } from '../../../../server/sdk';
import { BannerPlatform, IBanner } from '../../../../definition/IBanner';

API.v1.addRoute('banners.getNew', { authRequired: true }, { // deprecated
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

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform, bannerId));

		return API.v1.success({ banners });
	},
});


API.v1.addRoute('banners/:id', { authRequired: true }, {

	get() {
		check(this.urlParams, Match.ObjectIncluding({
			id: String,
		}));

		const { platform } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		const { id } = this.urlParams;
		if (!id) {
			throw new Meteor.Error('error-missing-param', 'The required "id" param is missing.');
		}

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform, id));

		return API.v1.success({ banners });
	},
});
API.v1.addRoute('banners', { authRequired: true }, {

	get() {
		check(this.queryParams, Match.ObjectIncluding({
			platform: String,
		}));

		const { platform } = this.queryParams;
		if (!platform) {
			throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
		}

		if (!Object.values(BannerPlatform).includes(platform)) {
			throw new Meteor.Error('error-unknown-platform', 'Platform is unknown.');
		}

		const banners = Promise.await(Banner.getBannersForUser(this.userId, platform));

		return API.v1.success({ banners });
	},
	...process.env.NODE_ENV !== 'production' && {
		post(): {} {
			check(this.bodyParams, Match.ObjectIncluding({
				platform: Match.Maybe(String),
				bid: String,
			}));

			const { platform = 'web', bid: bannerId } = this.bodyParams;

			if (!platform) {
				throw new Meteor.Error('error-missing-param', 'The required "platform" param is missing.');
			}

			if (!Object.values(BannerPlatform).includes(platform)) {
				throw new Meteor.Error('error-unknown-platform', 'Platform is unknown.');
			}
			const b: IBanner = {
				_id: bannerId,
				platform: [platform],
				expireAt: new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 7)),
				startAt: new Date(),
				roles: ['admin'],
				createdBy: {
					_id: this.userId,
					username: this.userId,
				},
				createdAt: new Date(),
				_updatedAt: new Date(),
				view: {
					viewId: '',
					appId: '',
					blocks: [{
						type: BlockType.SECTION,
						blockId: 'attention',
						text: {
							type: TextObjectType.PLAINTEXT,
							text: 'Test',
							emoji: false,
						},
					}],
				},
			};

			const banners = Promise.await(Banner.create(b));

			return API.v1.success({ banners });
		},
		delete(): {} {
			check(this.bodyParams, Match.ObjectIncluding({
				bid: String,
			}));

			const { bid } = this.bodyParams;

			Promise.await(Banner.disable(bid));

			return API.v1.success();
		},

		patch(): {} {
			check(this.bodyParams, Match.ObjectIncluding({
				bid: String,
			}));

			const { bid } = this.bodyParams;

			Promise.await(Banner.enable(bid));

			return API.v1.success();
		},
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
