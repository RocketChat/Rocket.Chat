import type { BannerPlatform, IBanner } from '../../IBanner';

export type BannersEndpoints = {
	/* @deprecated */
	'banners.getNew': {
		GET: (params: { platform: BannerPlatform; bid: IBanner['_id'] }) => {
			banners: IBanner[];
		};
	};

	'banners/:id': {
		GET: (params: { platform: BannerPlatform }) => {
			banners: IBanner[];
		};
	};

	'banners': {
		GET: (params: { platform: BannerPlatform }) => {
			banners: IBanner[];
		};
	};

	'banners.dismiss': {
		POST: (params: { bannerId: string }) => void;
	};
};
