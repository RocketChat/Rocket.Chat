import { Meteor } from 'meteor/meteor';
import { BlockType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Objects';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { IBanner, BannerPlatform } from '@rocket.chat/core-typings';

import { Banner } from '../../../../server/sdk';

const WARNING_BANNER_ID = 'closeToSeatsLimit';
const DANGER_BANNER_ID = 'reachedSeatsLimit';

const makeWarningBanner = (seats: number): IBanner => ({
	_id: WARNING_BANNER_ID,
	platform: [BannerPlatform.Web],
	roles: ['admin'],
	view: {
		icon: 'warning',
		variant: 'warning',
		viewId: '',
		appId: 'banner-core',
		blocks: [
			{
				type: BlockType.SECTION,
				blockId: 'attention',
				text: {
					type: TextObjectType.MARKDOWN,
					text: TAPi18n.__('Close_to_seat_limit_banner_warning', {
						seats,
						url: Meteor.absoluteUrl('/requestSeats'),
					}),
					emoji: false,
				},
			},
		],
	},
	createdBy: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	expireAt: new Date(8640000000000000),
	startAt: new Date(),
	createdAt: new Date(),
	_updatedAt: new Date(),
	active: false,
});

const makeDangerBanner = (): IBanner => ({
	_id: DANGER_BANNER_ID,
	platform: [BannerPlatform.Web],
	roles: ['admin'],
	view: {
		icon: 'ban',
		variant: 'danger',
		viewId: '',
		appId: 'banner-core',
		blocks: [
			{
				type: BlockType.SECTION,
				blockId: 'attention',
				text: {
					type: TextObjectType.MARKDOWN,
					text: TAPi18n.__('Reached_seat_limit_banner_warning', {
						url: Meteor.absoluteUrl('/requestSeats'),
					}),
					emoji: false,
				},
			},
		],
	},
	createdBy: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	expireAt: new Date(8640000000000000),
	startAt: new Date(),
	createdAt: new Date(),
	_updatedAt: new Date(),
	active: false,
});

export const createSeatsLimitBanners = async (): Promise<void> => {
	const [warning, danger] = await Promise.all([Banner.getById(WARNING_BANNER_ID), Banner.getById(DANGER_BANNER_ID)]);
	if (!warning) {
		Banner.create(makeWarningBanner(0));
	}
	if (!danger) {
		Banner.create(makeDangerBanner());
	}
};

export const enableDangerBanner = (): void => {
	Banner.enable(DANGER_BANNER_ID, makeDangerBanner());
};

export const disableDangerBannerDiscardingDismissal = async (): Promise<void> => {
	const banner = await Banner.getById(DANGER_BANNER_ID);
	if (banner?.active) {
		Banner.disable(DANGER_BANNER_ID);
		Banner.discardDismissal(DANGER_BANNER_ID);
	}
};

export const enableWarningBanner = (seatsLeft: number): void => {
	Banner.enable(WARNING_BANNER_ID, makeWarningBanner(seatsLeft));
};

export const disableWarningBannerDiscardingDismissal = async (): Promise<void> => {
	const banner = await Banner.getById(WARNING_BANNER_ID);
	if (banner?.active) {
		Banner.disable(WARNING_BANNER_ID);
		Banner.discardDismissal(WARNING_BANNER_ID);
	}
};
