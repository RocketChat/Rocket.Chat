// import Ajv, { JSONSchemaType } from 'ajv';

import type { BannerPlatform, IBanner } from '../../IBanner';

// const ajv = new Ajv();

type BannersGetNew = {
	platform: BannerPlatform;
	bid: IBanner['_id'];
};
/*
const BannersGetNewSchema: JSONSchemaType<BannersGetNew> = {
	type: 'object',
	properties: {
		platform: {
			type: 'object',
			properties: {
				Web: {
					type: 'string',
				},
				Mobile: {
					type: 'string',
				},
			},
		},
		bid: {
			type: 'string',
		},
	},
	required: ['platform', 'bid'],
	additionalProperties: false,
};

export const isBannersGetNew = ajv.compile(BannersGetNewSchema);
*/
export type BannersEndpoints = {
	/* @deprecated */
	'banners.getNew': {
		GET: (params: BannersGetNew) => {
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
