import { IBanner } from '../../IBanner';

export type BannersEndpoints = {
	/* @deprecated */
	'banners.getNew': {
		GET: () => ({
			banners: IBanner[];
		});
	};

	'banners/:id': {
		GET: (params: { platform: string }) => ({
			banners: IBanner[];
		});
	};

	'banners': {
		GET: () => ({
			banners: IBanner[];
		});
	};

	'banners.dismiss': {
		POST: (params: { bannerId: string }) => void;
	};
};
