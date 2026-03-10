import type { BannerPlatform, IBanner } from '@rocket.chat/core-typings';

export type BannersEndpoints = {
	'/v1/banners': {
		GET: (params: { platform: BannerPlatform }) => {
			banners: IBanner[];
		};
	};

	'/v1/banners.dismiss': {
		POST: (params: { bannerId: string }) => void;
	};
};
