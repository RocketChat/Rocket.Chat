import Ajv, { JSONSchemaType } from 'ajv';

import type { BannerPlatform, IBanner } from '../../IBanner';

const ajv = new Ajv();

type BannersGetNew = {
	platform: BannerPlatform;
	bid: IBanner['_id'];
};

const BannersGetNewSchema: JSONSchemaType<BannersGetNew> = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
		},
		bid: {
			type: 'string',
		},
	},
	required: ['platform', 'bid'],
	additionalProperties: false,
};

export const isBannersGetNew = ajv.compile(BannersGetNewSchema);

type BannersId = {
	platform: BannerPlatform;
};

const BannersIdSchema: JSONSchemaType<BannersId> = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBannersId = ajv.compile(BannersIdSchema);

type Banners = {
	platform: BannerPlatform;
};

const BannersSchema: JSONSchemaType<Banners> = {
	type: 'object',
	properties: {
		platform: {
			type: 'string',
		},
	},
	required: ['platform'],
	additionalProperties: false,
};

export const isBanners = ajv.compile(BannersSchema);

type BannersDismiss = {
	bannerId: string;
};

const BannersDismissSchema: JSONSchemaType<BannersDismiss> = {
	type: 'object',
	properties: {
		bannerId: {
			type: 'string',
		},
	},
	required: ['bannerId'],
	additionalProperties: false,
};

export const isBannersDismiss = ajv.compile(BannersDismissSchema);

export type BannersEndpoints = {
	/* @deprecated */
	'banners.getNew': {
		GET: (params: BannersGetNew) => {
			banners: IBanner[];
		};
	};

	'banners/:id': {
		GET: (params: BannersId) => {
			banners: IBanner[];
		};
	};

	'banners': {
		GET: (params: Banners) => {
			banners: IBanner[];
		};
	};

	'banners.dismiss': {
		POST: (params: BannersDismiss) => void;
	};
};
