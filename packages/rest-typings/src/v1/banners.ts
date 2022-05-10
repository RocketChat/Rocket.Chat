import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

export type BannersEndpoints = {
	/* @deprecated */
	'/v1/banners.getNew': {
		GET: (params: { platform: BannerPlatform; bid: IBanner['_id'] }) => {
			banners: IBanner[];
		};
	};

	'/v1/banners/:id': {
		GET: (params: { platform: BannerPlatform }) => {
			banners: IBanner[];
		};
	};

	'/v1/banners': {
		GET: (params: { platform: BannerPlatform }) => {
			banners: IBanner[];
		};
	};

	'/v1/banners.dismiss': {
		POST: (params: { bannerId: string }) => void;
	};
};
