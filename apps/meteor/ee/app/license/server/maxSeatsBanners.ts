import { BlockType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Blocks';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit/blocks/Objects';
import { Banner } from '@rocket.chat/core-services';
import type { IBanner } from '@rocket.chat/core-typings';
import { BannerPlatform } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../../server/lib/i18n';

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
					text: i18n.t('Close_to_seat_limit_banner_warning', {
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
					text: i18n.t('Reached_seat_limit_banner_warning', {
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
		await Banner.create(makeWarningBanner(0));
	}
	if (!danger) {
		await Banner.create(makeDangerBanner());
	}
};

export async function enableDangerBanner() {
	await Banner.enable(DANGER_BANNER_ID, makeDangerBanner());
}

export const disableDangerBannerDiscardingDismissal = async (): Promise<void> => {
	const banner = await Banner.getById(DANGER_BANNER_ID);
	if (banner?.active) {
		await Banner.disable(DANGER_BANNER_ID);
		await Banner.discardDismissal(DANGER_BANNER_ID);
	}
};

export async function enableWarningBanner(seatsLeft: number) {
	await Banner.enable(WARNING_BANNER_ID, makeWarningBanner(seatsLeft));
}

export async function disableWarningBannerDiscardingDismissal() {
	const banner = await Banner.getById(WARNING_BANNER_ID);
	if (banner?.active) {
		await Banner.disable(WARNING_BANNER_ID);
		await Banner.discardDismissal(WARNING_BANNER_ID);
	}
}
